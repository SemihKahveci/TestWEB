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
    try {
        // Contact form için özel from email, yoksa default kullan
        const fromAddress = fromEmail || process.env.MAILGUN_FROM_EMAIL;
        const fromName = process.env.MAILGUN_FROM_NAME || 'ANDRON Game';
        
        const data = {
            from: `${fromName} <${fromAddress}>`,
            to: to,
            subject: subject,
            html: html
        };

        if (replyTo) {
            data['h:Reply-To'] = replyTo;
        }

        const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, data);
        return { success: true, messageId: result.id };
    } catch (error) {
        const { safeLog } = require('../utils/helpers');
        safeLog('error', 'E-posta gönderme hatası', error);
        return { 
            success: false, 
            error: error.message || 'Mailgun servisi hatası',
            ...(process.env.NODE_ENV !== 'production' && { details: error.response?.data || null })
        };
    }
};

module.exports = {
    sendEmail
}; 