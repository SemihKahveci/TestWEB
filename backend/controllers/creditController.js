const Credit = require('../models/Credit');
const { safeLog, getSafeErrorMessage } = require('../utils/helpers');

// Cache for total credits to avoid repeated API calls
let totalCreditsCache = {
  value: 0,
  lastUpdated: null,
  ttl: 5 * 60 * 1000 // 5 minutes cache
};

// Helper function to get total credits with caching
const getTotalCreditsFromCache = async (req) => {
  const now = new Date();
  
  // If cache is valid, return cached value
  if (totalCreditsCache.lastUpdated && 
      (now - totalCreditsCache.lastUpdated) < totalCreditsCache.ttl) {
    return totalCreditsCache.value;
  }
  
  // Cache expired or doesn't exist, fetch from API
  try {
    const gameResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/game-management/games`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    let totalCredits = 0;
    if (gameResponse.ok) {
      const gameData = await gameResponse.json();
      const games = gameData.games || [];
      totalCredits = games.reduce((sum, game) => sum + (game.credit || 0), 0);
    }
    
    // Update cache
    totalCreditsCache.value = totalCredits;
    totalCreditsCache.lastUpdated = now;
    
    return totalCredits;
  } catch (error) {
    safeLog('error', 'Error fetching total credits', error);
    // Return cached value if available, otherwise 0
    return totalCreditsCache.value || 0;
  }
};

// Get user's credit information
const getUserCredits = async (req, res) => {
  try {
    const userId = req.admin._id; // Admin ID from auth middleware
    
    let credit = await Credit.findOne({ userId });
    
    if (!credit) {
      // Create new credit record if doesn't exist
      // Use cached total credits for faster response
      const totalCredits = await getTotalCreditsFromCache(req);
      
      credit = new Credit({
        userId,
        totalCredits: totalCredits,
        usedCredits: 0,
        remainingCredits: totalCredits,
        transactions: []
      });
      await credit.save();
    } else {
      // Mevcut kredi kaydı varsa, toplam krediyi güncelle
      const currentTotalCredits = await getTotalCreditsFromCache(req);
      
      if (credit.totalCredits !== currentTotalCredits) {
        safeLog('debug', `Toplam kredi güncelleniyor: ${credit.totalCredits} -> ${currentTotalCredits}`);
        credit.totalCredits = currentTotalCredits;
        credit.remainingCredits = currentTotalCredits - credit.usedCredits;
        await credit.save();
      }
    }
    
    res.json({
      success: true,
      credit: {
        totalCredits: credit.totalCredits,
        usedCredits: credit.usedCredits,
        remainingCredits: credit.remainingCredits,
        transactions: credit.transactions
      }
    });
  } catch (error) {
    safeLog('error', 'Get user credits error', error);
    res.status(500).json({
      success: false,
      message: 'Kredi bilgileri alınamadı'
    });
  }
};

// Update total credits (when new credits are purchased)
const updateTotalCredits = async (req, res) => {
  try {
    const userId = req.admin._id;
    const { amount, description } = req.body;
    
    let credit = await Credit.findOne({ userId });
    
    if (!credit) {
      credit = new Credit({
        userId,
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        transactions: []
      });
    }
    
    // Add new credits
    credit.totalCredits += amount;
    credit.remainingCredits = credit.totalCredits - credit.usedCredits;
    
    // Invalidate cache since total credits changed
    totalCreditsCache.lastUpdated = null;
    
    // Add transaction
    credit.transactions.push({
      type: 'credit_purchase',
      amount: amount,
      description: description || 'Kredi satın alındı',
      timestamp: new Date()
    });
    
    await credit.save();
    
    res.json({
      success: true,
      message: 'Toplam kredi güncellendi',
      credit: {
        totalCredits: credit.totalCredits,
        usedCredits: credit.usedCredits,
        remainingCredits: credit.remainingCredits
      }
    });
  } catch (error) {
    safeLog('error', 'Update total credits error', error);
    res.status(500).json({
      success: false,
      message: 'Kredi güncellenemedi'
    });
  }
};

// Deduct credits for game sending
const deductCredits = async (req, res) => {
  try {
    const userId = req.admin._id;
    const { 
      amount, 
      type, 
      description
    } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz kredi miktarı'
      });
    }
    
    let credit = await Credit.findOne({ userId });
    
    if (!credit) {
      // Create new credit record if doesn't exist
      // Use cached total credits for faster response
      const totalCredits = await getTotalCreditsFromCache(req);
      
      credit = new Credit({
        userId,
        totalCredits: totalCredits,
        usedCredits: 0,
        remainingCredits: totalCredits,
        transactions: []
      });
      await credit.save();
    }
    
    // If totalCredits is 0, update it from cache
    if (credit.totalCredits === 0) {
      const newTotalCredits = await getTotalCreditsFromCache(req);
      credit.totalCredits = newTotalCredits;
      credit.remainingCredits = newTotalCredits - credit.usedCredits;
    }
    
    // Check if user has enough credits
    if (credit.remainingCredits < amount) {
      return res.status(400).json({
        success: false,
        message: 'Yetersiz kredi'
      });
    }
    
    // Deduct credits
    credit.usedCredits += amount;
    credit.remainingCredits = credit.totalCredits - credit.usedCredits;
    
    // Add transaction
    credit.transactions.push({
      type: type || 'game_send',
      amount: amount,
      description: description,
      timestamp: new Date()
    });
    
    await credit.save();
    
    res.json({
      success: true,
      message: 'Kredi başarıyla düşürüldü',
      credit: {
        totalCredits: credit.totalCredits,
        usedCredits: credit.usedCredits,
        remainingCredits: credit.remainingCredits
      }
    });
  } catch (error) {
    safeLog('error', 'Deduct credits error', error);
    res.status(500).json({
      success: false,
      message: 'Kredi düşürülemedi'
    });
  }
};

// Get credit transactions
const getCreditTransactions = async (req, res) => {
  try {
    const userId = req.admin._id;
    const { page = 1, limit = 20 } = req.query;
    
    const credit = await Credit.findOne({ userId });
    
    if (!credit) {
      return res.json({
        success: true,
        transactions: [],
        total: 0
      });
    }
    
    // Sort transactions by timestamp (newest first)
    const sortedTransactions = credit.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      transactions: paginatedTransactions,
      total: credit.transactions.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    safeLog('error', 'Get credit transactions error', error);
    res.status(500).json({
      success: false,
      message: 'Kredi işlemleri alınamadı'
    });
  }
};

// Restore credits for expired games
const restoreCredits = async (req, res) => {
  try {
    const userId = req.admin._id;
    const { 
      amount, 
      type, 
      description
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz kredi miktarı'
      });
    }

    let credit = await Credit.findOne({ userId });
    
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Kredi kaydı bulunamadı'
      });
    }

    // Restore credits
    credit.usedCredits = Math.max(0, credit.usedCredits - amount);
    credit.remainingCredits = credit.totalCredits - credit.usedCredits;

    // Add transaction record
    credit.transactions.push({
      type: type || 'credit_restore',
      amount: amount,
      description: description,
      timestamp: new Date()
    });

    await credit.save();

    res.json({
      success: true,
      message: 'Kredi başarıyla geri yüklendi',
      credit: {
        totalCredits: credit.totalCredits,
        usedCredits: credit.usedCredits,
        remainingCredits: credit.remainingCredits
      }
    });
  } catch (error) {
    safeLog('error', 'Restore credits error', error);
    res.status(500).json({
      success: false,
      message: 'Kredi geri yüklenemedi'
    });
  }
};

// Function to invalidate cache (exported for use by other controllers)
const invalidateCache = () => {
  totalCreditsCache.lastUpdated = null;
};

module.exports = {
  getUserCredits,
  updateTotalCredits,
  deductCredits,
  restoreCredits,
  getCreditTransactions,
  invalidateCache
};
