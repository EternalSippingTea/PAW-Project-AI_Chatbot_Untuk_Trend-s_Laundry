const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');

test('serves the home, member ordering, and admin pages separately', async () => {
    const app = express();
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '..', 'views'));
    app.use(express.static(path.join(__dirname, '..', 'public')));
    app.use('/', require('../routes/view.routes'));
    const server = app.listen(0, '127.0.0.1');

    try {
        await new Promise(resolve => server.once('listening', resolve));
        const baseUrl = `http://127.0.0.1:${server.address().port}`;
        const pages = [
            ['/', 'Pakaian bersih, hari lebih ringan', '/js/home.js'],
            ['/pemesanan', 'Pemesanan Online', '/js/pemesanan.js'],
            ['/admin', 'Login Admin', '/js/admin.js']
        ];
        for (const [route, heading, script] of pages) {
            const response = await fetch(`${baseUrl}${route}`);
            assert.equal(response.status, 200, route);
            const html = await response.text();
            assert.match(html, new RegExp(heading));
            assert.ok(html.includes(script), route);
            if (route === '/pemesanan') {
                const frontend = await fetch(`${baseUrl}/js/pemesanan.js`);
                assert.match(await frontend.text(), /service\.satuan/);
            }
            if (route === '/admin') {
                assert.match(html, /id="admin-nav-dashboard"/);
                assert.match(html, /id="admin-nav-members"/);
                assert.match(html, /Berat \(kg\)/);
                const frontend = await fetch(`${baseUrl}/js/admin.js`);
                assert.match(await frontend.text(), /data-weight-input/);
            }
        }
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
});