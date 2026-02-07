const Credit = require('../models/Credit');
const { safeLog, getSafeErrorMessage } = require('../utils/helpers');
const { getCompanyFilter, addCompanyIdToData } = require('../middleware/auth');

// Cache for total credits per companyId to avoid repeated API calls
const totalCreditsCache = new Map(); // companyId -> { value, lastUpdated }
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Helper function to get total credits with caching (companyId bazında)
const getTotalCreditsFromCache = async (req, companyId) => {
  const now = new Date();
  const companyIdStr = companyId?.toString() || 'default';
  
  // If cache is valid for this company, return cached value
  const cached = totalCreditsCache.get(companyIdStr);
  if (cached && 
      cached.lastUpdated && 
      (now - cached.lastUpdated) < CACHE_TTL) {
    return cached.value;
  }
  
  // Cache expired or doesn't exist, fetch from API
  try {
    // GameManagement'ten tüm oyunları al (companyId filtresi zaten getAllGames'de yapılıyor)
    const GameManagement = require('../models/gameManagement');
    const { getCompanyFilter } = require('../middleware/auth');
    
    // companyId'yi req'e ekle (getCompanyFilter için)
    const companyFilter = companyId 
      ? { companyId: companyId instanceof require('mongoose').Types.ObjectId ? companyId : new require('mongoose').Types.ObjectId(companyId) }
      : getCompanyFilter(req);
    
    const games = await GameManagement.find(companyFilter, 'credit');
    const totalCredits = games.reduce((sum, game) => sum + (game.credit || 0), 0);
    
    // Update cache for this company
    totalCreditsCache.set(companyIdStr, {
      value: totalCredits,
      lastUpdated: now
    });
    
    return totalCredits;
  } catch (error) {
    safeLog('error', 'Error fetching total credits', error);
    // Return cached value if available, otherwise 0
    return cached?.value || 0;
  }
};

// Get user's credit information (companyId bazında - aynı companyId'ye sahip adminler ortak kredi havuzunu görür)
const getUserCredits = async (req, res) => {
  try {
    const userId = req.admin._id; // Admin ID from auth middleware (transaction geçmişi için)
    
    // Aynı companyId'ye sahip tüm adminler aynı kredi kaydını paylaşır
    // companyId'yi al: normal admin için req.admin.companyId, super admin için req.query.companyId (GET request)
    let companyId = req.admin.companyId;
    
    // Super admin için query parametresinden al (GET request'te body yerine query kullanılır)
    if (req.admin.role === 'superadmin' && req.query?.companyId) {
      companyId = req.query.companyId;
    }
    
    // Super admin için companyId yoksa, hata döndür (super admin company seçmeli)
    if (!companyId) {
      if (req.admin.role === 'superadmin') {
        return res.status(400).json({
          success: false,
          message: 'Super admin için company ID gereklidir. Lütfen bir company seçin.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Company ID bulunamadı'
      });
    }
    
    // companyId'yi ObjectId'ye çevir
    const mongoose = require('mongoose');
    const companyIdObj = companyId instanceof mongoose.Types.ObjectId 
      ? companyId 
      : new mongoose.Types.ObjectId(companyId);
    
    let credit = await Credit.findOne({ companyId: companyIdObj });
    
    if (!credit) {
      // Create new credit record if doesn't exist
      // Use cached total credits for faster response
      const totalCredits = await getTotalCreditsFromCache(req, companyIdObj);
      
      // Yeni kredi kaydı oluştur - companyId bazında
      credit = new Credit({
        userId: userId.toString(), // İlk oluşturan admin (opsiyonel)
        companyId: companyIdObj,
        totalCredits: totalCredits,
        usedCredits: 0,
        remainingCredits: totalCredits,
        transactions: []
      });
      await credit.save();
    } else {
      // Mevcut kredi kaydı varsa, toplam krediyi güncelle
      const currentTotalCredits = await getTotalCreditsFromCache(req, companyIdObj);
      
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

// Update total credits (when new credits are purchased) - companyId bazında
const updateTotalCredits = async (req, res) => {
  try {
    const userId = req.admin._id;
    const { amount, description } = req.body;
    
    // companyId'yi al
    const companyId = req.admin.role === 'superadmin' && req.body?.companyId 
      ? req.body.companyId 
      : req.admin.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID bulunamadı'
      });
    }
    
    // companyId'yi ObjectId'ye çevir
    const mongoose = require('mongoose');
    const companyIdObj = companyId instanceof mongoose.Types.ObjectId 
      ? companyId 
      : new mongoose.Types.ObjectId(companyId);
    
    let credit = await Credit.findOne({ companyId: companyIdObj });
    
    if (!credit) {
      // Yeni kredi kaydı oluştur - companyId bazında
      credit = new Credit({
        userId: userId.toString(), // İlk oluşturan admin (opsiyonel)
        companyId: companyIdObj,
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        transactions: []
      });
    }
    
    // Add new credits
    credit.totalCredits += amount;
    credit.remainingCredits = credit.totalCredits - credit.usedCredits;
    
    // Invalidate cache since total credits changed (companyId bazında)
    invalidateCache(companyIdObj);
    
    // Add transaction
    credit.transactions.push({
      type: 'credit_purchase',
      amount: amount,
      description: description || `Kredi satın alındı (Admin: ${req.admin.name})`,
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

// Deduct credits for game sending - companyId bazında
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
    
    // companyId'yi al
    const companyId = req.admin.role === 'superadmin' && req.body?.companyId 
      ? req.body.companyId 
      : req.admin.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID bulunamadı'
      });
    }
    
    // companyId'yi ObjectId'ye çevir
    const mongoose = require('mongoose');
    const companyIdObj = companyId instanceof mongoose.Types.ObjectId 
      ? companyId 
      : new mongoose.Types.ObjectId(companyId);
    
    let credit = await Credit.findOne({ companyId: companyIdObj });
    
    if (!credit) {
      // Create new credit record if doesn't exist
      // Use cached total credits for faster response
      const totalCredits = await getTotalCreditsFromCache(req, companyIdObj);
      
      // Yeni kredi kaydı oluştur - companyId bazında
      credit = new Credit({
        userId: userId.toString(), // İlk oluşturan admin (opsiyonel)
        companyId: companyIdObj,
        totalCredits: totalCredits,
        usedCredits: 0,
        remainingCredits: totalCredits,
        transactions: []
      });
      await credit.save();
    }
    
    // If totalCredits is 0, update it from cache
    if (credit.totalCredits === 0) {
      const newTotalCredits = await getTotalCreditsFromCache(req, companyIdObj);
      credit.totalCredits = newTotalCredits;
      credit.remainingCredits = newTotalCredits - credit.usedCredits;
    }
    
    // Check if company has enough credits
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
      description: description || `Değerlendirme gönderildi (Admin: ${req.admin.name})`,
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

// Get credit transactions - companyId bazında
const getCreditTransactions = async (req, res) => {
  try {
    const userId = req.admin._id;
    const { page = 1, limit = 20 } = req.query;
    
    // companyId'yi al
    const companyId = req.admin.role === 'superadmin' && req.body?.companyId 
      ? req.body.companyId 
      : req.admin.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID bulunamadı'
      });
    }
    
    const credit = await Credit.findOne({ companyId });
    
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

// Restore credits for expired games - companyId bazında
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

    // companyId'yi al
    const companyId = req.admin.role === 'superadmin' && req.body?.companyId 
      ? req.body.companyId 
      : req.admin.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID bulunamadı'
      });
    }

    let credit = await Credit.findOne({ companyId });
    
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
      description: description || `Kredi geri yüklendi (Admin: ${req.admin.name})`,
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
// companyId verilirse sadece o company'nin cache'ini invalidate eder, verilmezse tüm cache'i temizler
const invalidateCache = (companyId = null) => {
  if (companyId) {
    const companyIdStr = companyId.toString();
    totalCreditsCache.delete(companyIdStr);
  } else {
    totalCreditsCache.clear();
  }
};

module.exports = {
  getUserCredits,
  updateTotalCredits,
  deductCredits,
  restoreCredits,
  getCreditTransactions,
  invalidateCache
};
