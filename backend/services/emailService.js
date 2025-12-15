const formData = require('form-data');
const Mailgun = require('mailgun.js');
require('dotenv').config();

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
    url: 'https://api.mailgun.net'
});

const sendEmail = async (to, subject, html, replyTo = null, fromEmail = null) => {
    const { safeLog } = require('../utils/helpers');
    
    try {
        // Environment variables kontrolü
        if (!process.env.MAILGUN_API_KEY) {
            safeLog('error', 'MAILGUN_API_KEY environment variable eksik!');
            return { 
                success: false, 
                error: 'Mailgun API anahtarı yapılandırılmamış'
            };
        }
        
        if (!process.env.MAILGUN_DOMAIN) {
            safeLog('error', 'MAILGUN_DOMAIN environment variable eksik!');
            return { 
                success: false, 
                error: 'Mailgun domain yapılandırılmamış'
            };
        }
        
        // Contact form için özel from email, yoksa default kullan
        const fromAddress = fromEmail || process.env.MAILGUN_FROM_EMAIL;
        if (!fromAddress) {
            safeLog('error', 'MAILGUN_FROM_EMAIL environment variable eksik!');
            return { 
                success: false, 
                error: 'Gönderen e-posta adresi yapılandırılmamış'
            };
        }
        
        const fromName = process.env.MAILGUN_FROM_NAME || 'ANDRON Game';
        
        safeLog('debug', 'Mail gönderme başlatılıyor', {
            to,
            from: `${fromName} <${fromAddress}>`,
            domain: process.env.MAILGUN_DOMAIN,
            hasApiKey: !!process.env.MAILGUN_API_KEY,
            environment: process.env.NODE_ENV
        });
        
        const data = {
            from: `${fromName} <${fromAddress}>`,
            to: to,
            subject: subject,
            html: html
        };

        if (replyTo) {
            data['h:Reply-To'] = replyTo;
        }

        // Timeout ekle (30 saniye)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Mailgun API timeout: İstek 30 saniye içinde tamamlanamadı')), 30000);
        });

        const mailgunPromise = mg.messages.create(process.env.MAILGUN_DOMAIN, data);
        
        safeLog('debug', 'Mailgun API çağrısı yapılıyor...');
        const result = await Promise.race([mailgunPromise, timeoutPromise]);
        
        if (result && result.id) {
            safeLog('info', 'E-posta başarıyla gönderildi', {
                to,
                messageId: result.id,
                domain: process.env.MAILGUN_DOMAIN
            });
            return { success: true, messageId: result.id };
        } else {
            safeLog('error', 'Mailgun API geçersiz yanıt döndü', { result });
            return { 
                success: false, 
                error: 'Mailgun API geçersiz yanıt döndü'
            };
        }
    } catch (error) {
        safeLog('error', 'E-posta gönderme hatası', {
            error: error.message,
            stack: error.stack,
            to,
            domain: process.env.MAILGUN_DOMAIN,
            hasApiKey: !!process.env.MAILGUN_API_KEY,
            response: error.response?.data || null,
            status: error.response?.status || null,
            statusText: error.response?.statusText || null
        });
        
        // Daha detaylı hata mesajı
        let errorMessage = error.message || 'Mailgun servisi hatası';
        
        if (error.response) {
            // Mailgun API'den gelen hata detayları
            const errorData = error.response.data || error.response.body;
            if (errorData && errorData.message) {
                errorMessage = `Mailgun API Hatası: ${errorData.message}`;
            } else if (error.response.status === 401) {
                errorMessage = 'Mailgun API anahtarı geçersiz veya yetkisiz';
            } else if (error.response.status === 402) {
                errorMessage = 'Mailgun hesabı yetersiz bakiye veya ödeme gerekli';
            } else if (error.response.status === 403) {
                errorMessage = 'Mailgun domain doğrulaması başarısız';
            }
        }
        
        return { 
            success: false, 
            error: errorMessage,
            ...(process.env.NODE_ENV !== 'production' && { 
                details: error.response?.data || null,
                status: error.response?.status || null
            })
        };
    }
};

module.exports = {
    sendEmail
}; 