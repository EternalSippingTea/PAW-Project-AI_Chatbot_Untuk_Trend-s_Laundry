const {
    normalizeIndonesianPhone,
    isValidIndonesianPhone
} = require('../utils/phoneNumber');

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 200;

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sendInvalid(res, fields) {
    return res.status(400).json({
        success: false,
        error: 'Periksa kembali data akun.',
        fields
    });
}

function validateRegister(req, res, next) {
    if (!isObject(req.body)) {
        return sendInvalid(res, { _: 'Kirim data dalam format JSON.' });
    }

    const nama = typeof req.body.nama === 'string' ? req.body.nama.trim() : '';
    const nomorHp = typeof req.body.nomor_hp === 'string'
        ? normalizeIndonesianPhone(req.body.nomor_hp.trim())
        : '';
    const alamat = typeof req.body.alamat === 'string' ? req.body.alamat.trim() : '';
    const password = req.body.password;
    const konfirmasi = req.body.konfirmasi_password;
    const fields = {};

    if (nama.length < 2 || nama.length > 100) {
        fields.nama = 'Nama wajib diisi (2–100 karakter).';
    } else if (/\d/.test(nama)) {
        fields.nama = 'Nama tidak boleh mengandung angka.';
    } else if (!/^[a-zA-ZÀ-ž\s.'-]+$/.test(nama)) {
        fields.nama = 'Nama hanya boleh berisi huruf, spasi, dan titik.';
    }
    if (!isValidIndonesianPhone(nomorHp) || nomorHp.length > 20) {
        fields.nomor_hp = 'Masukkan nomor HP Indonesia yang valid, contoh 08123456789.';
    }
    if (alamat.length < 5 || alamat.length > 500) {
        fields.alamat = 'Alamat wajib diisi (5–500 karakter).';
    }
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
        fields.password = `Password harus ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} karakter.`;
    }
    if (typeof konfirmasi !== 'string' || konfirmasi !== password) {
        fields.konfirmasi_password = 'Konfirmasi password tidak sama.';
    }
    if (Object.keys(fields).length > 0) return sendInvalid(res, fields);

    req.body = { nama, nomor_hp: nomorHp, alamat, password };
    return next();
}

function validateLogin(req, res, next) {
    if (!isObject(req.body)) {
        return sendInvalid(res, { _: 'Kirim data dalam format JSON.' });
    }

    const nomorHp = typeof req.body.nomor_hp === 'string'
        ? normalizeIndonesianPhone(req.body.nomor_hp.trim())
        : '';
    const password = req.body.password;
    const fields = {};
    if (!isValidIndonesianPhone(nomorHp) || nomorHp.length > 20) {
        fields.nomor_hp = 'Masukkan nomor HP Indonesia yang valid.';
    }
    if (typeof password !== 'string' || !password || password.length > PASSWORD_MAX_LENGTH) {
        fields.password = 'Password wajib diisi.';
    }
    if (Object.keys(fields).length > 0) return sendInvalid(res, fields);

    req.body = { nomor_hp: nomorHp, password };
    return next();
}

module.exports = { validateRegister, validateLogin };