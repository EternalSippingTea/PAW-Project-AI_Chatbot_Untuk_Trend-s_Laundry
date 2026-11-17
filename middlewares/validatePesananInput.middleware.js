const {
    normalizeIndonesianPhone,
    isValidIndonesianPhone
} = require('../utils/phoneNumber');

const STATUS_PESANAN = [
    'Antrian Masuk',
    'Sedang Dicuci',
    'Sedang Disetrika',
    'Siap Diambil',
    'Pesanan Sudah Diambil',
    'Diterima'
];

const FIELD_LIMITS = {
    nama_pelanggan: 100,
    nomor_hp: 20,
    alamat: 500,
    layanan: 100,
    catatan: 1000
};

const MAX_WEIGHT_KG = 999999.99;

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateFields(body, partial) {
    const errors = {};
    const values = {};
    const requiredFields = ['nama_pelanggan', 'nomor_hp', 'alamat', 'layanan'];
    const fields = [...requiredFields, 'catatan'];

    for (const field of fields) {
        const present = Object.prototype.hasOwnProperty.call(body, field);
        if (partial && !present) continue;

        const value = body[field];
        if (field === 'catatan' && !present && !partial) {
            values[field] = '';
            continue;
        }

        if (typeof value !== 'string') {
            errors[field] = 'Kolom ini wajib diisi.';
            continue;
        }

        const normalized = field === 'nomor_hp'
            ? normalizeIndonesianPhone(value.trim())
            : value.trim();

        if (!normalized && requiredFields.includes(field)) {
            errors[field] = 'Kolom ini wajib diisi.';
            continue;
        }
        if (normalized.length > FIELD_LIMITS[field]) {
            errors[field] = `Maksimal ${FIELD_LIMITS[field]} karakter.`;
            continue;
        }
        if (field === 'nama_pelanggan') {
            if (normalized.length < 2) {
                errors[field] = 'Nama minimal 2 karakter.';
                continue;
            }
            if (/\d/.test(normalized)) {
                errors[field] = 'Nama pelanggan tidak boleh mengandung angka.';
                continue;
            }
            if (!/^[a-zA-ZÀ-ž\s.'-]+$/.test(normalized)) {
                errors[field] = 'Nama pelanggan hanya boleh berisi huruf, spasi, dan titik.';
                continue;
            }
        }
        if (field === 'nomor_hp' && normalized && !isValidIndonesianPhone(normalized)) {
            errors[field] = 'Masukkan nomor HP Indonesia yang valid, contoh 08123456789.';
            continue;
        }
        if (field === 'alamat' && normalized.length < 5) {
            errors[field] = 'Alamat minimal 5 karakter.';
            continue;
        }

        values[field] = normalized;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
        if (typeof body.status !== 'string' || !STATUS_PESANAN.includes(body.status.trim())) {
            errors.status = 'Pilih status pesanan yang tersedia.';
        } else {
            values.status = body.status.trim();
        }
    }

    if (partial && Object.prototype.hasOwnProperty.call(body, 'berat_kg')) {
        const rawWeight = body.berat_kg;
        if (rawWeight === null || rawWeight === '') {
            values.berat_kg = null;
        } else {
            const weightText = typeof rawWeight === 'number'
                ? String(rawWeight)
                : typeof rawWeight === 'string'
                    ? rawWeight.trim()
                    : '';
            const weight = Number(weightText);
            if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(weightText)
                || !Number.isFinite(weight)
                || weight <= 0
                || weight > MAX_WEIGHT_KG) {
                errors.berat_kg = 'Berat harus lebih dari 0 dan maksimal 2 angka desimal.';
            } else {
                values.berat_kg = weightText;
            }
        }
    }

    if (partial && Object.keys(values).length === 0 && Object.keys(errors).length === 0) {
        errors._ = 'Tidak ada data pesanan untuk diperbarui.';
    }

    return { errors, values };
}

function createValidator(partial) {
    return (req, res, next) => {
        if (!isObject(req.body)) {
            return res.status(400).json({
                success: false,
                error: 'Data pesanan tidak valid.',
                fields: { _: 'Kirim data pesanan dalam format JSON.' }
            });
        }

        const { errors, values } = validateFields(req.body, partial);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Periksa kembali data pesanan.',
                fields: errors
            });
        }

        req.body = values;
        return next();
    };
}

module.exports = {
    validateCreatePesanan: createValidator(false),
    validateUpdatePesanan: createValidator(true)
};