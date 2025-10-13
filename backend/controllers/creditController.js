const Credit = require('../models/Credit');

// Get user's credit information
const getUserCredits = async (req, res) => {
  try {
    const userId = req.admin._id; // Admin ID from auth middleware
    
    let credit = await Credit.findOne({ userId });
    
    if (!credit) {
      // Create new credit record if doesn't exist
      // Get total credits from game management
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
      
      credit = new Credit({
        userId,
        totalCredits: totalCredits,
        usedCredits: 0,
        remainingCredits: totalCredits,
        transactions: []
      });
      await credit.save();
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
    console.error('Get user credits error:', error);
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
    console.error('Update total credits error:', error);
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
    console.log('🔍 Existing credit record:', credit);
    
    if (!credit) {
      console.log('📝 Creating new credit record...');
      // Create new credit record if doesn't exist
      // Get total credits from game management
      const gameResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/game-management/games`, {
        headers: {
          'Authorization': req.headers.authorization
        }
      });
      
      console.log('🎮 Game management response status:', gameResponse.status);
      
      let totalCredits = 0;
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
        console.log('🎮 Game data received:', gameData);
        const games = gameData.games || [];
        console.log('🎮 Games array:', games);
        totalCredits = games.reduce((sum, game) => sum + (game.credit || 0), 0);
        console.log('💰 Total credits from games:', totalCredits);
      } else {
        console.error('❌ Game management API error:', gameResponse.status);
        const errorText = await gameResponse.text();
        console.error('❌ Game management API error response:', errorText);
      }
      
      credit = new Credit({
        userId,
        totalCredits: totalCredits,
        usedCredits: 0,
        remainingCredits: totalCredits,
        transactions: []
      });
      await credit.save();
      console.log('✅ New credit record created:', credit);
    }
    
    // If totalCredits is 0, update it from game management
    if (credit.totalCredits === 0) {
      console.log('🔄 Updating totalCredits from game management...');
      const gameResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/game-management/games`, {
        headers: {
          'Authorization': req.headers.authorization
        }
      });
      
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
        const games = gameData.games || [];
        const newTotalCredits = games.reduce((sum, game) => sum + (game.credit || 0), 0);
        credit.totalCredits = newTotalCredits;
        credit.remainingCredits = newTotalCredits - credit.usedCredits;
        console.log('💰 Updated totalCredits:', newTotalCredits);
      }
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
      message: 'Kredi düşüldü',
      credit: {
        totalCredits: credit.totalCredits,
        usedCredits: credit.usedCredits,
        remainingCredits: credit.remainingCredits
      }
    });
  } catch (error) {
    console.error('Deduct credits error:', error);
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
    console.error('Get credit transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Kredi işlemleri alınamadı'
    });
  }
};

module.exports = {
  getUserCredits,
  updateTotalCredits,
  deductCredits,
  getCreditTransactions
};
