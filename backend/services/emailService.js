const nodemailer = require('nodemailer');
require('dotenv').config();

// E-posta gönderici yapılandırması
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// E-posta gönderme fonksiyonu
const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('E-posta gönderildi:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    transporter
}; 