const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const path = require('node:path');
const produkService = require('../services/produk.service');
const geminiService = require('../services/gemini.service');
const { GeminiConfigurationError } = require('../config/gemini');
const chatController = require('../controllers/chat.controller');
const validateChatInput = require('../middlewares/validateChatInput.middleware');
const routes = require('../routes');

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

test('menolak pesan kosong atau terlalu panjang sebelum mengakses layanan', async () => {
    const emptyResponse = createResponse();
    let emptyNextCalled = false;
    validateChatInput({ body: { message: '  ' } }, emptyResponse, () => {
        emptyNextCalled = true;
    });
    assert.equal(emptyResponse.statusCode, 400);
    assert.equal(emptyNextCalled, false);

    const longResponse = createResponse();
    let longNextCalled = false;
    validateChatInput({ body: { message: 'x'.repeat(1001) } }, longResponse, () => {
        longNextCalled = true;
    });
    assert.equal(longResponse.statusCode, 400);
    assert.equal(longNextCalled, false);
});

test('mengambil konteks produk dan mengembalikan format respons endpoint', async () => {
    const products = [{ nama: 'Cuci Kering', harga: 12000 }];
    const originalGetAll = produkService.getAll;
    const originalGenerateReply = geminiService.generateReply;
    let receivedMessage;
    let receivedProducts;
    produkService.getAll = async () => products;
    geminiService.generateReply = async (message, contextProducts) => {
        receivedMessage = message;
        receivedProducts = contextProducts;
        return 'Layanan tersedia.';
    };

    try {
        const response = createResponse();
        const request = { body: { message: '  Apa layanan yang tersedia?  ' } };
        validateChatInput(request, response, () => {});
        await chatController.postChat(request, response);
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.body, {
            success: true,
            data: { reply: 'Layanan tersedia.' }
        });
        assert.equal(receivedMessage, 'Apa layanan yang tersedia?');
        assert.equal(receivedProducts, products);
    } finally {
        produkService.getAll = originalGetAll;
        geminiService.generateReply = originalGenerateReply;
    }
});

test('mengembalikan error konfigurasi yang jelas tanpa membocorkan detail provider', async () => {
    const originalGetAll = produkService.getAll;
    const originalGenerateReply = geminiService.generateReply;
    const originalError = console.error;
    produkService.getAll = async () => [];
    geminiService.generateReply = async () => {
        throw new GeminiConfigurationError('key details');
    };
    console.error = () => {};

    try {
        const response = createResponse();
        await chatController.postChat({ body: { message: 'Berapa tarifnya?' } }, response);
        assert.equal(response.statusCode, 503);
        assert.match(response.body.error, /belum dikonfigurasi/);
        assert.doesNotMatch(JSON.stringify(response.body), /key details/);
    } finally {
        produkService.getAll = originalGetAll;
        geminiService.generateReply = originalGenerateReply;
        console.error = originalError;
    }
});

test('menjelaskan penolakan akses Gemini tanpa mengungkap detail sensitif', async () => {
    const originalGetAll = produkService.getAll;
    const originalGenerateReply = geminiService.generateReply;
    const originalError = console.error;
    produkService.getAll = async () => [];
    geminiService.generateReply = async () => {
        const error = new Error('Gemini mengembalikan status HTTP 403.');
        error.status = 403;
        error.code = 'GEMINI_HTTP_ERROR';
        throw error;
    };
    console.error = () => {};

    try {
        const response = createResponse();
        await chatController.postChat({ body: { message: 'Berapa tarifnya?' } }, response);
        assert.equal(response.statusCode, 502);
        assert.match(response.body.error, /API key dan akses Generative Language API/);
        assert.doesNotMatch(JSON.stringify(response.body), /secret|key details/i);
    } finally {
        produkService.getAll = originalGetAll;
        geminiService.generateReply = originalGenerateReply;
        console.error = originalError;
    }
});

test('menjelaskan gangguan kapasitas sementara dari Gemini', async () => {
    const originalGetAll = produkService.getAll;
    const originalGenerateReply = geminiService.generateReply;
    const originalError = console.error;
    produkService.getAll = async () => [];
    geminiService.generateReply = async () => {
        const error = new Error('Gemini sedang mengalami lonjakan permintaan.');
        error.status = 503;
        throw error;
    };
    console.error = () => {};

    try {
        const response = createResponse();
        await chatController.postChat({ body: { message: 'Berapa jam bukanya?' } }, response);
        assert.equal(response.statusCode, 502);
        assert.match(response.body.error, /lonjakan permintaan/);
    } finally {
        produkService.getAll = originalGetAll;
        geminiService.generateReply = originalGenerateReply;
        console.error = originalError;
    }
});

test('melayani kontrak endpoint POST /api/chat melalui router aplikasi', async () => {
    const originalGetAll = produkService.getAll;
    const originalGenerateReply = geminiService.generateReply;
    produkService.getAll = async () => [];
    geminiService.generateReply = async () => 'Silakan lihat daftar layanan kami.';
    const app = express();
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../views'));
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(express.json());
    app.use('/', routes);
    const server = app.listen(0, '127.0.0.1');

    try {
        await new Promise(resolve => server.once('listening', resolve));
        const baseUrl = `http://127.0.0.1:${server.address().port}`;
        const pageResponse = await fetch(baseUrl);
        const page = await pageResponse.text();
        assert.equal(pageResponse.status, 200);
        assert.match(page, /\/js\/home\.js/);
        assert.match(page, /\/css\/styles\.css/);
        assert.match(page, /Pakaian bersih, hari lebih ringan/);
        assert.match(page, /href="\/pemesanan"/);

        const scriptResponse = await fetch(`${baseUrl}/js/home.js`);
        assert.equal(scriptResponse.status, 200);
        assert.match(await scriptResponse.text(), /api\/chat/);

        const styleResponse = await fetch(`${baseUrl}/css/styles.css`);
        assert.equal(styleResponse.status, 200);

        const invalidResponse = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: '  ' })
        });
        assert.equal(invalidResponse.status, 400);

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Bagaimana melihat layanan?' })
        });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            success: true,
            data: { reply: 'Silakan lihat daftar layanan kami.' }
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
        produkService.getAll = originalGetAll;
        geminiService.generateReply = originalGenerateReply;
    }
});