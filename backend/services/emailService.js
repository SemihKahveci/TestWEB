const formData = require('form-data');
const Mailgun = require('mailgun.js');
require('dotenv').config();

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
    url: 'https://api.mailgun.net'
});

const sendEmail = async (to, subject, html) => {
    try {
        const data = {
            from: `${process.env.MAILGUN_FROM_NAME} <${process.env.MAILGUN_FROM_EMAIL}>`,
            to: to,
            subject: subject,
            html: html
        };

        const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, data);
        console.log('E-posta gönderildi:', result.id);
        return { success: true, messageId: result.id };
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        throw error;
    }
};

module.exports = {
    sendEmail
}; 