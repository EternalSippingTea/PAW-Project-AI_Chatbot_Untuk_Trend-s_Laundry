const test = require('node:test');
const assert = require('node:assert/strict');
const { validateProduk } = require('../middlewares/validateProdukInput.middleware');

test('menolak nama layanan yang mengandung angka atau kurang dari 4 huruf', () => {
    // 1. Nama mengandung angka
    const resAngka = validateProduk({
        nama: 'Cuci 2 Hari',
        harga: 10000,
        satuan: 'kg',
        estimasi: '2 hari'
    });
    assert.equal(resAngka.isValid, false);
    assert.equal(resAngka.errors.nama, 'Nama layanan tidak boleh mengandung angka.');

    // 2. Nama hanya angka
    const resHanyaAngka = validateProduk({
        nama: '12345',
        harga: 10000,
        satuan: 'kg',
        estimasi: '2 hari'
    });
    assert.equal(resHanyaAngka.isValid, false);
    assert.equal(resHanyaAngka.errors.nama, 'Nama layanan tidak boleh mengandung angka.');

    // 3. Nama kurang dari 4 huruf
    const resKurang = validateProduk({
        nama: 'Jas',
        harga: 15000,
        satuan: 'pcs',
        estimasi: '1 hari'
    });
    assert.equal(resKurang.isValid, false);
    assert.equal(resKurang.errors.nama, 'Nama layanan minimal terdiri dari 4 huruf.');

    // 4. Nama valid (minimal 4 huruf, tanpa angka)
    const resValid = validateProduk({
        nama: 'Cuci Setrika Komplit',
        harga: 12000,
        satuan: 'kg',
        estimasi: '2 hari'
    });
    assert.equal(resValid.isValid, true);
    assert.equal(resValid.data.nama, 'Cuci Setrika Komplit');
});

test('menolak harga <= 0, satuan tidak valid, atau estimasi kosong', () => {
    const invalid = validateProduk({
        nama: 'Cuci Kilat',
        harga: 0,
        satuan: '1',
        estimasi: 'a'
    });
    assert.equal(invalid.isValid, false);
    assert.ok(invalid.errors.harga);
    assert.ok(invalid.errors.satuan);
    assert.ok(invalid.errors.estimasi);

    const valid = validateProduk({
        nama: 'Cuci Bedcover Besar',
        harga: '25.000',
        satuan: 'pcs',
        estimasi: '2-3 hari',
        deskripsi: 'Khusus bedcover tebal'
    });
    assert.equal(valid.isValid, true);
    assert.equal(valid.data.harga, 25000);
    assert.equal(valid.data.satuan, 'pcs');
    assert.equal(valid.data.estimasi, '2-3 hari');
    assert.equal(valid.data.deskripsi, 'Khusus bedcover tebal');
});