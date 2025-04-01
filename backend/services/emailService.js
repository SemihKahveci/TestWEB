const nodemailer = require('nodemailer');

// E-posta gönderici yapılandırması
const transporter = nodemailer.createTransport({
    service: 'gmail', // Gmail kullanıyoruz
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// E-posta gönderme fonksiyonu
const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('E-posta gönderildi:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendEmail
}; 