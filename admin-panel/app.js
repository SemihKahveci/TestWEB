require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // HTTPS kullanıyorsanız true yapın
}));

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Game Modeli
const Game = mongoose.model('Game', {
    playerName: String,
    answers: [{
        questionNumber: String,
        answerType1: String,
        answerType2: String,
        answerValue1: String,
        answerValue2: String,
        total: Number
    }],
    totalScore: Number,
    date: { type: Date, default: Date.now }
});

// Auth Middleware
const requireAuth = (req, res, next) => {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
        req.session.isAuthenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre' });
    }
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.post('/api/game', requireAuth, async (req, res) => {
    try {
        const game = new Game(req.body);
        await game.save();
        res.json({ success: true, message: 'Oyun sonucu başarıyla eklendi' });
    } catch (error) {
        console.error('Oyun sonucu eklenirken hata:', error);
        res.status(500).json({ success: false, message: 'Oyun sonucu eklenirken hata oluştu' });
    }
});

app.get('/api/games', requireAuth, async (req, res) => {
    try {
        const games = await Game.find().sort({ date: -1 });
        res.json(games);
    } catch (error) {
        console.error('Oyun sonuçları alınırken hata:', error);
        res.status(500).json({ success: false, message: 'Oyun sonuçları alınırken hata oluştu' });
    }
});

app.delete('/api/games', requireAuth, async (req, res) => {
    try {
        await Game.deleteMany({});
        res.json({ success: true, message: 'Tüm sonuçlar başarıyla silindi' });
    } catch (error) {
        console.error('Sonuçlar silinirken hata:', error);
        res.status(500).json({ success: false, message: 'Sonuçlar silinirken hata oluştu' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 