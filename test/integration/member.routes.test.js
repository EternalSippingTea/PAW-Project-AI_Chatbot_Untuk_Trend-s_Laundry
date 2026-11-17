const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const session = require('express-session');
const memberService = require('../services/member.service');
const produkService = require('../services/produk.service');
const pesananService = require('../services/pesanan.service');

test('member can register, access the order form API, and place an order tied to their account', async () => {
    const originals = {
        getByPhone: memberService.getByPhone,
        getById: memberService.getById,
        createMember: memberService.create,
        getProducts: produkService.getAll,
        createOrder: pesananService.create
    };
    const members = [];
    let createdOrder;
    memberService.getByPhone = async phone => members.find(member => member.nomor_hp === phone) || null;
    memberService.getById = async id => {
        const member = members.find(item => item.id === id);
        if (!member) return null;
        const { password_hash, ...safeMember } = member;
        return safeMember;
    };
    memberService.create = async data => {
        const member = {
            id: members.length + 1,
            ...data,
            created_at: new Date('2026-01-01T00:00:00.000Z')
        };
        members.push(member);
        return member;
    };
    produkService.getAll = async () => [{
        nama: 'Cuci Kering',
        estimasi: '2 hari'
    }];
    pesananService.create = async data => {
        createdOrder = data;
        return data;
    };

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
        const orderPayload = {
            nama_pelanggan: 'Nama Palsu',
            nomor_hp: '08111111111',
            alamat: 'Jalan Melati No. 5',
            layanan: 'Cuci Kering',
            catatan: '',
            member_id: 999
        };

        const unauthenticatedOrder = await fetch(`${baseUrl}/api/pesanan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        assert.equal(unauthenticatedOrder.status, 401);

        const registerResponse = await fetch(`${baseUrl}/api/member/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama: 'Farhan',
                nomor_hp: '08123456789',
                alamat: 'Jalan Melati No. 5',
                password: 'password-aman-123',
                konfirmasi_password: 'password-aman-123'
            })
        });
        assert.equal(registerResponse.status, 201);
        const registerData = await registerResponse.json();
        assert.equal(registerData.data.nama, 'Farhan');
        assert.equal(Object.hasOwn(registerData.data, 'password_hash'), false);
        const cookie = registerResponse.headers.get('set-cookie').split(';')[0];

        const sessionResponse = await fetch(`${baseUrl}/api/member/session`, {
            headers: { Cookie: cookie }
        });
        assert.equal(sessionResponse.status, 200);

        const orderResponse = await fetch(`${baseUrl}/api/pesanan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie },
            body: JSON.stringify(orderPayload)
        });
        assert.equal(orderResponse.status, 201);
        assert.equal(createdOrder.member_id, 1);
        assert.equal(createdOrder.nama_pelanggan, 'Farhan');
        assert.equal(createdOrder.nomor_hp, '08123456789');

        const duplicateRegistration = await fetch(`${baseUrl}/api/member/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama: 'Farhan',
                nomor_hp: '08123456789',
                alamat: 'Jalan Melati No. 5',
                password: 'password-aman-123',
                konfirmasi_password: 'password-aman-123'
            })
        });
        assert.equal(duplicateRegistration.status, 409);

        const logoutResponse = await fetch(`${baseUrl}/api/member/logout`, {
            method: 'POST',
            headers: { Cookie: cookie }
        });
        assert.equal(logoutResponse.status, 200);
        const loginResponse = await fetch(`${baseUrl}/api/member/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nomor_hp: '08123456789',
                password: 'password-aman-123'
            })
        });
        assert.equal(loginResponse.status, 200);
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
        memberService.getByPhone = originals.getByPhone;
        memberService.getById = originals.getById;
        memberService.create = originals.createMember;
        produkService.getAll = originals.getProducts;
        pesananService.create = originals.createOrder;
    }
});