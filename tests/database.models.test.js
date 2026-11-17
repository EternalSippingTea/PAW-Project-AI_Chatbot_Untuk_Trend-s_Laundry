const test = require('node:test');
const assert = require('node:assert/strict');
const { sequelize, Produk, Pesanan, Member } = require('../models');

test('mendefinisikan model Sequelize sesuai tabel PostgreSQL laundry yang sudah ada', () => {
    assert.equal(sequelize.getDialect(), 'postgres');
    assert.equal(Produk.getTableName(), 'produk');
    assert.equal(Pesanan.getTableName(), 'pesanan');
    assert.equal(Member.getTableName(), 'member');
    assert.equal(Produk.options.timestamps, false);
    assert.equal(Pesanan.options.timestamps, false);
    assert.equal(Member.options.timestamps, false);
    assert.equal(Produk.primaryKeyAttribute, 'id');
    assert.equal(Pesanan.primaryKeyAttribute, 'kode_invoice');
    assert.deepEqual(Object.keys(Produk.rawAttributes), [
        'id',
        'nama',
        'deskripsi',
        'harga',
        'satuan',
        'estimasi'
    ]);
    assert.deepEqual(Object.keys(Pesanan.rawAttributes), [
        'kode_invoice',
        'member_id',
        'nama_pelanggan',
        'nomor_hp',
        'alamat',
        'layanan',
        'catatan',
        'status',
        'estimasi',
        'berat_kg'
    ]);
    assert.deepEqual(Object.keys(Member.rawAttributes), [
        'id',
        'nama',
        'nomor_hp',
        'alamat',
        'password_hash',
        'created_at'
    ]);
});

test('service produk mempertahankan bentuk data dan urutan API yang ada', async () => {
    const produkService = require('../services/produk.service');
    const originalFindAll = Produk.findAll;
    const originalFindByPk = Produk.findByPk;
    const originalCreate = Produk.create;
    const row = { id: 1, nama: 'Cuci Kering', harga: 12000 };
    const instance = {
        get: () => ({ ...row }),
        update: async values => Object.assign(row, values),
        destroy: async () => {}
    };

    let order;
    Produk.findAll = async options => {
        order = options.order;
        return [instance];
    };
    Produk.findByPk = async () => instance;
    Produk.create = async values => {
        assert.deepEqual(values, {
            nama: 'Cuci Kering',
            deskripsi: 'Pakaian sehari-hari',
            harga: 12000,
            satuan: 'kg',
            estimasi: '2 hari'
        });
        return instance;
    };

    try {
        assert.deepEqual(await produkService.getAll(), [row]);
        assert.deepEqual(order, [['id', 'ASC']]);
        assert.deepEqual(await produkService.getById(1), row);
        assert.deepEqual(await produkService.create({
            nama: 'Cuci Kering',
            deskripsi: 'Pakaian sehari-hari',
            harga: 12000,
            satuan: 'kg',
            estimasi: '2 hari'
        }), row);
        assert.deepEqual(await produkService.update(1, {
            nama: 'Cuci Express',
            deskripsi: 'Pakaian sehari-hari',
            harga: 15000,
            satuan: 'kg',
            estimasi: '1 hari'
        }), row);
        assert.equal(await produkService.delete(1), 1);
        Produk.findByPk = async () => null;
        assert.equal(await produkService.delete(2), 0);
    } finally {
        Produk.findAll = originalFindAll;
        Produk.findByPk = originalFindByPk;
        Produk.create = originalCreate;
    }
});

test('service pesanan mempertahankan primary key invoice dan status dari alur pesanan', async () => {
    const pesananService = require('../services/pesanan.service');
    const originalFindAll = Pesanan.findAll;
    const originalFindByPk = Pesanan.findByPk;
    const originalCreate = Pesanan.create;
    const row = {
        kode_invoice: 'TLK-1001',
        member_id: null,
        nama_pelanggan: 'Pelanggan',
        nomor_hp: '08123456789',
        alamat: 'Alamat toko',
        layanan: 'Cuci Kering',
        catatan: null,
        status: 'Antrian Masuk',
        estimasi: '2 hari',
        berat_kg: null
    };
    const instance = {
        get: () => ({ ...row }),
        update: async values => Object.assign(row, values),
        destroy: async () => {}
    };

    let order;
    let lookedUpInvoice;
    Pesanan.findAll = async options => {
        order = options.order;
        return [instance];
    };
    Pesanan.findByPk = async invoice => {
        lookedUpInvoice = invoice;
        return instance;
    };
    Pesanan.create = async values => {
        assert.deepEqual(values, row);
        return instance;
    };

    try {
        assert.deepEqual(await pesananService.getAll(), [row]);
        assert.deepEqual(order, [['kode_invoice', 'DESC']]);
        assert.deepEqual(await pesananService.getByKodeInvoice(' tlk-1001 '), row);
        assert.equal(lookedUpInvoice, 'TLK-1001');
        assert.deepEqual(await pesananService.create({
            ...row,
            kode_invoice: 'TLK-1001',
            status: 'Antrian Masuk'
        }), row);
        assert.deepEqual(await pesananService.create({
            ...row,
            status: undefined
        }), row);
        assert.deepEqual(await pesananService.update('TLK-1001', {
            nama_pelanggan: 'Pelanggan Baru',
            nomor_hp: '08123456789',
            alamat: 'Alamat toko',
            layanan: 'Cuci Kering',
            status: 'Siap Diambil',
            catatan: 'Silakan diambil'
        }), row);
        await pesananService.update('TLK-1001', { status: 'Sedang Dicuci' });
        await pesananService.update('TLK-1001', { berat_kg: '2.5' });
        assert.equal(row.status, 'Sedang Dicuci');
        assert.equal(row.berat_kg, '2.5');
        assert.equal(row.nama_pelanggan, 'Pelanggan Baru');
        assert.equal(row.nomor_hp, '08123456789');
        assert.equal(row.alamat, 'Alamat toko');
        assert.equal(row.layanan, 'Cuci Kering');
        assert.equal(row.catatan, 'Silakan diambil');
        assert.equal(await pesananService.delete('TLK-1001'), 1);
        Pesanan.findByPk = async () => null;
        assert.equal(await pesananService.delete('TLK-9999'), 0);
    } finally {
        Pesanan.findAll = originalFindAll;
        Pesanan.findByPk = originalFindByPk;
        Pesanan.create = originalCreate;
    }
});