const test = require('node:test');
const assert = require('node:assert/strict');
const pesananService = require('../services/pesanan.service');
const produkService = require('../services/produk.service');
const memberService = require('../services/member.service');
const pesananController = require('../controllers/pesanan.controller');

function createResponse() {
    return {
        statusCode: null,
        body: null,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test('membuat pesanan pelanggan dengan status awal dan estimasi dari layanan database', async () => {
    const originalGetAll = produkService.getAll;
    const originalCreate = pesananService.create;
    const originalGetMemberById = memberService.getById;
    let createdOrder;
    produkService.getAll = async () => [{
        nama: 'Cuci Kering',
        estimasi: '2 hari'
    }];
    memberService.getById = async id => ({
        id,
        nama: 'Farhan',
        nomor_hp: '08123456789'
    });
    pesananService.create = async data => {
        createdOrder = data;
        return data;
    };

    try {
        const response = createResponse();
        await pesananController.postPesananPelanggan({
            body: {
                nama_pelanggan: 'Farhan',
                nomor_hp: '08123456789',
                alamat: 'Jalan Melati No. 5',
                layanan: 'cuci kering',
                catatan: '',
                status: 'Pesanan Sudah Diambil'
            },
            session: { memberId: 7 }
        }, response);

        assert.equal(response.statusCode, 201);
        assert.match(createdOrder.kode_invoice, /^TLK-\d{4}$/);
        assert.equal(createdOrder.layanan, 'Cuci Kering');
        assert.equal(createdOrder.estimasi, '2 hari');
        assert.equal(createdOrder.status, 'Antrian Masuk');
        assert.equal(createdOrder.member_id, 7);
        assert.equal(createdOrder.nama_pelanggan, 'Farhan');
        assert.equal(createdOrder.nomor_hp, '08123456789');
    } finally {
        produkService.getAll = originalGetAll;
        pesananService.create = originalCreate;
        memberService.getById = originalGetMemberById;
    }
});

test('menolak layanan yang tidak ada dan hanya mengembalikan data status publik', async () => {
    const originalGetAll = produkService.getAll;
    const originalCreate = pesananService.create;
    const originalGetByKodeInvoice = pesananService.getByKodeInvoice;
    const originalGetMemberById = memberService.getById;
    produkService.getAll = async () => [{ nama: 'Cuci Kering', estimasi: '2 hari' }];
    memberService.getById = async id => ({
        id,
        nama: 'Farhan',
        nomor_hp: '08123456789'
    });
    let createCalled = false;
    pesananService.create = async () => {
        createCalled = true;
        return {};
    };

    try {
        const invalidResponse = createResponse();
        await pesananController.postPesananPelanggan({
            body: {
                nama_pelanggan: 'Farhan',
                nomor_hp: '08123456789',
                alamat: 'Jalan Melati No. 5',
                layanan: 'Layanan palsu',
                catatan: ''
            },
            session: { memberId: 7 }
        }, invalidResponse);
        assert.equal(invalidResponse.statusCode, 400);
        assert.equal(createCalled, false);

        pesananService.getByKodeInvoice = async () => ({
            kode_invoice: 'TLK-1234',
            nama_pelanggan: 'Farhan',
            nomor_hp: '08123456789',
            alamat: 'Jalan Melati No. 5',
            layanan: 'Cuci Kering',
            status: 'Antrian Masuk',
            estimasi: '2 hari'
        });
        const statusResponse = createResponse();
        await pesananController.getStatusPesanan({
            params: { kodeInvoice: 'TLK-1234' }
        }, statusResponse);
        assert.deepEqual(statusResponse.body, {
            kode_invoice: 'TLK-1234',
            nama_pelanggan: 'Farhan',
            status: 'Antrian Masuk',
            layanan: 'Cuci Kering',
            berat_kg: null,
            estimasi: '2 hari'
        });
        assert.equal(Object.prototype.hasOwnProperty.call(statusResponse.body, 'nomor_hp'), false);
        assert.equal(Object.prototype.hasOwnProperty.call(statusResponse.body, 'alamat'), false);
    } finally {
        produkService.getAll = originalGetAll;
        pesananService.create = originalCreate;
        pesananService.getByKodeInvoice = originalGetByKodeInvoice;
        memberService.getById = originalGetMemberById;
    }
});