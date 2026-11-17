const { timingSafeEqual } = require('node:crypto');
const config = require('../config');
const { regenerateSession, saveSession, destroySession } = require('../utils/session');

function safeEqual(actual, expected) {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length
        && timingSafeEqual(actualBuffer, expectedBuffer);
}

module.exports = {
    login: async (req, res) => {
        const { username, password } = req.body || {};
        if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username dan password wajib diisi.'
            });
        }

        const expectedUsername = typeof config.ADMIN_USERNAME === 'string'
            ? config.ADMIN_USERNAME.trim()
            : '';
        const expectedPassword = config.ADMIN_PASSWORD;
        if (!expectedUsername || typeof expectedPassword !== 'string' || expectedPassword.length < 12) {
            return res.status(503).json({
                success: false,
                error: 'Login admin belum dikonfigurasi dengan benar. Isi ADMIN_USERNAME dan password minimal 12 karakter di .env.'
            });
        }

        const usernameMatches = safeEqual(username.trim(), expectedUsername);
        const passwordMatches = safeEqual(password, expectedPassword);
        if (!usernameMatches || !passwordMatches) {
            return res.status(401).json({
                success: false,
                error: 'Username atau password salah.'
            });
        }

        try {
            await regenerateSession(req);
            req.session.adminUsername = expectedUsername;
            await saveSession(req);
            return res.status(200).json({
                success: true,
                data: { username: expectedUsername }
            });
        } catch (error) {
            console.error('Gagal membuat sesi admin:', error);
            return res.status(500).json({
                success: false,
                error: 'Login gagal diproses. Silakan coba lagi.'
            });
        }
    },

    getSession: (req, res) => {
        return res.status(200).json({
            success: true,
            data: { username: req.session.adminUsername }
        });
    },

    logout: async (req, res) => {
        try {
            await destroySession(req);
            res.clearCookie('trendslaundry.sid', {
                httpOnly: true,
                sameSite: 'strict',
                secure: config.ENV === 'production'
            });
            return res.status(200).json({
                success: true,
                message: 'Logout berhasil.'
            });
        } catch (error) {
            console.error('Gagal mengakhiri sesi admin:', error);
            return res.status(500).json({
                success: false,
                error: 'Logout gagal diproses. Silakan coba lagi.'
            });
        }
    }
};
