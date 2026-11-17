function validateProduk(body, isUpdate = false) {
    const errors = {};
    const values = {};

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return {
            isValid: false,
            errors: { _: 'Kirim data layanan dalam format JSON yang valid.' },
            data: {}
        };
    }

    // 1. Validasi Nama Layanan: Tidak boleh angka & minimal 4 huruf
    const hasNama = Object.prototype.hasOwnProperty.call(body, 'nama');
    if (!isUpdate || hasNama) {
        const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
        if (!nama) {
            errors.nama = 'Nama layanan wajib diisi.';
        } else if (/\d/.test(nama)) {
            errors.nama = 'Nama layanan tidak boleh mengandung angka.';
        } else if (nama.replace(/[^a-zA-ZÀ-ž]/g, '').length < 4) {
            errors.nama = 'Nama layanan minimal terdiri dari 4 huruf.';
        } else if (nama.length > 100) {
            errors.nama = 'Nama layanan maksimal 100 karakter.';
        } else if (!/^[a-zA-ZÀ-ž\s&/()\-+]+$/.test(nama)) {
            errors.nama = 'Nama layanan hanya boleh mengandung huruf, spasi, dan simbol standar (&, /, -, ()).';
        } else {
            values.nama = nama;
        }
    }

    // 2. Validasi Harga (Rp)
    const hasHarga = Object.prototype.hasOwnProperty.call(body, 'harga');
    if (!isUpdate || hasHarga) {
        const rawHarga = typeof body.harga === 'string'
            ? body.harga.replace(/\D/g, '')
            : body.harga;
        const harga = Number(rawHarga);

        if (rawHarga === '' || rawHarga === null || rawHarga === undefined || Number.isNaN(harga)) {
            errors.harga = 'Harga layanan wajib diisi.';
        } else if (!Number.isFinite(harga) || harga <= 0) {
            errors.harga = 'Harga layanan harus lebih dari Rp 0.';
        } else if (harga < 500) {
            errors.harga = 'Harga layanan minimal Rp 500.';
        } else if (harga > 100000000) {
            errors.harga = 'Harga layanan maksimal Rp 100.000.000.';
        } else {
            values.harga = Math.round(harga);
        }
    }

    // 3. Validasi Satuan (contoh: kg)
    const hasSatuan = Object.prototype.hasOwnProperty.call(body, 'satuan');
    if (!isUpdate || hasSatuan) {
        const satuan = typeof body.satuan === 'string' ? body.satuan.trim() : '';
        if (!satuan) {
            errors.satuan = 'Satuan layanan wajib diisi (contoh: kg).';
        } else if (satuan.length < 2) {
            errors.satuan = 'Satuan minimal 2 karakter (contoh: kg).';
        } else if (satuan.length > 30) {
            errors.satuan = 'Satuan maksimal 30 karakter.';
        } else if (/\d/.test(satuan) && !/^[a-zA-ZÀ-ž\s/]+[23]?$/.test(satuan)) {
            errors.satuan = 'Satuan tidak boleh berupa angka (contoh: kg).';
        } else {
            values.satuan = satuan;
        }
    }

    // 4. Validasi Estimasi (contoh: 2-3 hari, 24 jam)
    const hasEstimasi = Object.prototype.hasOwnProperty.call(body, 'estimasi');
    if (!isUpdate || hasEstimasi) {
        const estimasi = typeof body.estimasi === 'string' ? body.estimasi.trim() : '';
        if (!estimasi) {
            errors.estimasi = 'Estimasi pengerjaan wajib diisi (contoh: 2-3 hari, 24 jam).';
        } else if (estimasi.length < 3) {
            errors.estimasi = 'Estimasi minimal 3 karakter (contoh: 1 hari, 24 jam).';
        } else if (estimasi.length > 50) {
            errors.estimasi = 'Estimasi maksimal 50 karakter.';
        } else {
            values.estimasi = estimasi;
        }
    }

    // 5. Validasi Deskripsi (opsional)
    const hasDeskripsi = Object.prototype.hasOwnProperty.call(body, 'deskripsi');
    if (hasDeskripsi) {
        const deskripsi = typeof body.deskripsi === 'string' ? body.deskripsi.trim() : '';
        if (deskripsi && deskripsi.length < 5) {
            errors.deskripsi = 'Deskripsi minimal 5 karakter jika diisi.';
        } else if (deskripsi.length > 1000) {
            errors.deskripsi = 'Deskripsi maksimal 1000 karakter.';
        } else {
            values.deskripsi = deskripsi || null;
        }
    } else if (!isUpdate) {
        values.deskripsi = null;
    }

    if (isUpdate && Object.keys(values).length === 0 && Object.keys(errors).length === 0) {
        errors._ = 'Tidak ada data layanan untuk diperbarui.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        data: values
    };
}

function createProdukValidator(isUpdate) {
    return (req, res, next) => {
        const { isValid, errors, data } = validateProduk(req.body, isUpdate);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Periksa kembali data layanan yang dimasukkan.',
                fields: errors
            });
        }
        req.body = data;
        return next();
    };
}

module.exports = {
    validateProduk,
    validateCreateProduk: createProdukValidator(false),
    validateUpdateProduk: createProdukValidator(true)
};