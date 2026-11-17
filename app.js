const express = require('express');
const path = require('path');
const crypto = require('node:crypto');
const session = require('express-session');
const config = require('./config');
const { sequelize } = require('./models');
const logger = require('./middlewares/logger.js');
const routes = require('./routes/index.js');

const app = express();
const sessionSecret = config.SESSION_SECRET || (
    config.ENV === 'production' ? null : crypto.randomBytes(32).toString('hex')
);

if (!sessionSecret) {
    throw new Error('SESSION_SECRET wajib diatur di .env saat NODE_ENV=production.');
}
if (config.SESSION_SECRET && Buffer.byteLength(config.SESSION_SECRET) < 32) {
    throw new Error('SESSION_SECRET harus berisi minimal 32 byte.');
}
if (!config.SESSION_SECRET) {
    console.warn('SESSION_SECRET belum diatur; sesi admin development hanya berlaku selama proses berjalan.');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    name: 'trendslaundry.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: config.ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000
    }
}));
app.use(logger);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

async function start() {
    try {
        await sequelize.authenticate();
        console.log('Koneksi database berhasil');
        await sequelize.sync();
        console.log('Skema database siap');
    } catch (error) {
        console.error('Gagal menginisialisasi database:', error.message);
        await sequelize.close();
        process.exitCode = 1;
        return;
    }

    const server = app.listen(config.PORT, () => {
        console.log(`[${config.ENV}] Server berjalan di http://localhost:${config.PORT}`);
    });
    return server;
}

if (require.main === module) {
    start();
}

module.exports = { app, start };
