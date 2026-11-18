const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const session = require('express-session');
const config = require('../config');
const produkController = require('../controllers/produk.controller');

test('admin session protects CRUD and customer orders require member authentication', async () => {
    const originalUsername = config.ADMIN_USERNAME;
    const originalPassword = config.ADMIN_PASSWORD;
    const originalPostProduk = produkController.postProduk;
    config.ADMIN_USERNAME = '';
    config.ADMIN_PASSWORD = '';
    produkController.postProduk = (req, res) => res.status(201).json({ success: true });

    const app = express();
    app.use(express.json());
    app.use(session({
        name: 'trendslaundry.sid',
        secret: 'test-only-session-secret-that-is-long-enough',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, sameSite: 'strict' }
    }));
    app.use('/api', require('../routes/api'));
    const server = app.listen(0, '127.0.0.1');

    try {
        await new Promise(resolve => server.once('listening', resolve));
        const baseUrl = `http://127.0.0.1:${server.address().port}`;

        const unconfiguredLoginResponse = await fetch(`${baseUrl}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test-admin', password: 'test-password' })
        });
        assert.equal(unconfiguredLoginResponse.status, 503);
        config.ADMIN_USERNAME = 'test-admin';
        config.ADMIN_PASSWORD = 'test-password';

        const protectedResponse = await fetch(`${baseUrl}/api/produk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        assert.equal(protectedResponse.status, 401);

        const invalidOrderResponse = await fetch(`${baseUrl}/api/pesanan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        assert.equal(invalidOrderResponse.status, 401);

        const unauthorizedWeightUpdate = await fetch(`${baseUrl}/api/pesanan/TLK-1001`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ berat_kg: 2.5 })
        });
        assert.equal(unauthorizedWeightUpdate.status, 401);

        const failedLoginResponse = await fetch(`${baseUrl}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test-admin', password: 'wrong-password' })
        });
        assert.equal(failedLoginResponse.status, 401);

        const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test-admin', password: 'test-password' })
        });
        assert.equal(loginResponse.status, 200);
        const cookie = loginResponse.headers.get('set-cookie').split(';')[0];

        const sessionResponse = await fetch(`${baseUrl}/api/admin/session`, {
            headers: { Cookie: cookie }
        });
        assert.equal(sessionResponse.status, 200);

        const authorizedProductResponse = await fetch(`${baseUrl}/api/produk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie },
            body: JSON.stringify({})
        });
        assert.equal(authorizedProductResponse.status, 201);

        const logoutResponse = await fetch(`${baseUrl}/api/admin/logout`, {
            method: 'POST',
            headers: { Cookie: cookie }
        });
        assert.equal(logoutResponse.status, 200);

        const expiredSessionResponse = await fetch(`${baseUrl}/api/admin/session`, {
            headers: { Cookie: cookie }
        });
        assert.equal(expiredSessionResponse.status, 401);
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
        config.ADMIN_USERNAME = originalUsername;
        config.ADMIN_PASSWORD = originalPassword;
        produkController.postProduk = originalPostProduk;
    }
});
