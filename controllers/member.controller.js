const memberService = require('../services/member.service');
const memberCredentialService = require('../services/memberCredential.service');
const config = require('../config');
const { regenerateSession, saveSession, destroySession } = require('../utils/session');

function toPublicMember(member) {
    return {
        id: member.id,
        nama: member.nama,
        nomor_hp: member.nomor_hp,
        alamat: member.alamat,
        created_at: member.created_at
    };
}

function isUniquePhoneError(error) {
    return error.name === 'SequelizeUniqueConstraintError'
        || error.original && error.original.code === '23505';
}

module.exports = {
    register: async (req, res) => {
        try {
            const existing = await memberService.getByPhone(req.body.nomor_hp);
            if (existing) {
                return res.status(409).json({
                    success: false,
                    error: 'Nomor HP sudah terdaftar.',
                    fields: { nomor_hp: 'Gunakan nomor HP lain atau silakan login.' }
                });
            }

            const passwordHash = await memberCredentialService.hashPassword(req.body.password);
            const member = await memberService.create({
                nama: req.body.nama,
                nomor_hp: req.body.nomor_hp,
                alamat: req.body.alamat,
                password_hash: passwordHash
            });

            await regenerateSession(req);
            req.session.memberId = member.id;
            await saveSession(req);
            return res.status(201).json({
                success: true,
                data: toPublicMember(member)
            });
        } catch (error) {
            if (isUniquePhoneError(error)) {
                return res.status(409).json({
                    success: false,
                    error: 'Nomor HP sudah terdaftar.',
                    fields: { nomor_hp: 'Gunakan nomor HP lain atau silakan login.' }
                });
            }
            console.error('Gagal mendaftarkan member:', error);
            return res.status(500).json({
                success: false,
                error: 'Pendaftaran gagal diproses. Silakan coba lagi.'
            });
        }
    },

    login: async (req, res) => {
        try {
            const member = await memberService.getByPhone(req.body.nomor_hp);
            const passwordMatches = member
                ? await memberCredentialService.verifyPassword(req.body.password, member.password_hash)
                : false;
            if (!passwordMatches) {
                return res.status(401).json({
                    success: false,
                    error: 'Nomor HP atau password salah.'
                });
            }

            await regenerateSession(req);
            req.session.memberId = member.id;
            await saveSession(req);
            return res.status(200).json({
                success: true,
                data: toPublicMember(member)
            });
        } catch (error) {
            console.error('Gagal memproses login member:', error);
            return res.status(500).json({
                success: false,
                error: 'Login gagal diproses. Silakan coba lagi.'
            });
        }
    },

    getSession: async (req, res) => {
        try {
            const member = await memberService.getById(req.session.memberId);
            if (!member) {
                return res.status(401).json({
                    success: false,
                    error: 'Sesi member tidak berlaku. Silakan login kembali.'
                });
            }
            return res.status(200).json({ success: true, data: member });
        } catch (error) {
            console.error('Gagal memeriksa sesi member:', error);
            return res.status(500).json({
                success: false,
                error: 'Sesi member tidak dapat diperiksa.'
            });
        }
    },

    logout: async (req, res) => {
        try {
            await destroySession(req);
            res.clearCookie('trendslaundry.sid', {
                httpOnly: true,
                sameSite: 'strict',
                secure: config.ENV === 'production'
            });
            return res.status(200).json({ success: true, message: 'Logout berhasil.' });
        } catch (error) {
            console.error('Gagal mengakhiri sesi member:', error);
            return res.status(500).json({
                success: false,
                error: 'Logout gagal diproses. Silakan coba lagi.'
            });
        }
    }
};