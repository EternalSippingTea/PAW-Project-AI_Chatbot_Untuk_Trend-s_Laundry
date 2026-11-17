const test = require('node:test');
const assert = require('node:assert/strict');
const {
    validateCreatePesanan,
    validateUpdatePesanan
} = require('../middlewares/validatePesananInput.middleware');

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

test('memvalidasi dan menormalisasi data pesanan pelanggan', () => {
    const request = {
        body: {
            nama_pelanggan: '  Farhan  ',
            nomor_hp: '+62 812-3456-7890',
            alamat: '  Jalan Melati No. 5  ',
            layanan: '  Cuci Kering  '
        }
    };
    const response = createResponse();
    let nextCalled = false;

    validateCreatePesanan(request, response, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, null);
    assert.deepEqual(request.body, {
        nama_pelanggan: 'Farhan',
        nomor_hp: '+6281234567890',
        alamat: 'Jalan Melati No. 5',
        layanan: 'Cuci Kering',
        catatan: ''
    });
});

test('menolak pesanan dengan nama, nomor HP, alamat, atau layanan tidak valid', () => {
    const request = {
        body: {
            nama_pelanggan: 'A',
            nomor_hp: '12345',
            alamat: 'Jln',
            layanan: ''
        }
    };
    const response = createResponse();
    let nextCalled = false;

    validateCreatePesanan(request, response, () => {
        nextCalled = true;
    });

    assert.equal(response.statusCode, 400);
    assert.equal(nextCalled, false);
    assert.ok(response.body.fields.nama_pelanggan);
    assert.ok(response.body.fields.nomor_hp);
    assert.ok(response.body.fields.alamat);
    assert.ok(response.body.fields.layanan);
});

test('mendukung pembaruan status parsial dan menolak status yang tidak dikenal', () => {
    const validResponse = createResponse();
    const validRequest = { body: { status: 'Sedang Dicuci', catatan: '' } };
    let nextCalled = false;

    validateUpdatePesanan(validRequest, validResponse, () => {
        nextCalled = true;
    });

    test('memvalidasi berat pesanan hanya pada pembaruan admin', () => {
        const validResponse = createResponse();
        const validRequest = { body: { berat_kg: 2.5 } };
        let nextCalled = false;

        validateUpdatePesanan(validRequest, validResponse, () => {
            nextCalled = true;
        });
        assert.equal(nextCalled, true);
        assert.deepEqual(validRequest.body, { berat_kg: '2.5' });

        const clearResponse = createResponse();
        const clearRequest = { body: { berat_kg: null } };
        validateUpdatePesanan(clearRequest, clearResponse, () => {});
        assert.equal(clearResponse.statusCode, null);
        assert.deepEqual(clearRequest.body, { berat_kg: null });

        const invalidResponse = createResponse();
        validateUpdatePesanan({ body: { berat_kg: 0 } }, invalidResponse, () => {});
        assert.equal(invalidResponse.statusCode, 400);
        assert.ok(invalidResponse.body.fields.berat_kg);

        const customerResponse = createResponse();
        const customerRequest = {
            body: {
                nama_pelanggan: 'Farhan',
                nomor_hp: '08123456789',
                alamat: 'Jalan Melati No. 5',
                layanan: 'Cuci Kering',
                berat_kg: 3
            }
        };
        validateCreatePesanan(customerRequest, customerResponse, () => {});
        assert.equal(Object.prototype.hasOwnProperty.call(customerRequest.body, 'berat_kg'), false);
    });
    assert.equal(nextCalled, true);
    assert.deepEqual(validRequest.body, { catatan: '', status: 'Sedang Dicuci' });

    const invalidResponse = createResponse();
    validateUpdatePesanan({ body: { status: 'Status lain' } }, invalidResponse, () => {});
    assert.equal(invalidResponse.statusCode, 400);
    assert.ok(invalidResponse.body.fields.status);
});