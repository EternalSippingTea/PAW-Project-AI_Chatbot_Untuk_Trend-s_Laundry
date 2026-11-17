tests/integration/gemini.integration.test.js
const assert = require('node:assert/strict');
const test = require('node:test');
const geminiService = require('../../services/gemini.service');

test('gets a non-empty reply from the configured Gemini API', async () => {
    const reply = await geminiService.generateReply(
        'Berapa harga layanan Cuci Kering per kg? Jawab singkat.',
        [{
            nama: 'Cuci Kering',
            deskripsi: 'Pakaian sehari-hari',
            harga: 12000,
            satuan: 'kg',
            estimasi: '2 hari'
        }]
    );

    assert.equal(typeof reply, 'string');
    assert.ok(reply.trim().length > 0);
});