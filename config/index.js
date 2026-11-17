require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    ENV: process.env.NODE_ENV || 'development',
    APP_NAME: "AI Chatbot Trend's Laundry",
    SESSION_SECRET: process.env.SESSION_SECRET,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
};