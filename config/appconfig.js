require('dotenv').config();
const { Pool } = require('pg');

// Setup koneksi PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

module.exports = {
    PORT: process.env.PORT || 3000,
    ENV: process.env.NODE_ENV || 'development',
    APP_NAME: "AI Chatbot Trend's Laundry",
    db: pool
};