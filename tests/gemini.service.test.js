const test = require('node:test');
const assert = require('node:assert/strict');
const geminiService = require('../services/gemini.service');

test('mengirim system instruction dan konteks laundry ke Gemini tanpa mengekspos key ke body', async () => {
    const originalApiKey = process.env.GEMINI_API_KEY;
    const originalModel = process.env.GEMINI_MODEL;
    const originalFetch = global.fetch;
    let requestUrl;
    let requestOptions;
    process.env.GEMINI_API_KEY = 'test-secret-key';
    process.env.GEMINI_MODEL = 'gemini-test';
    global.fetch = async (url, options) => {
        requestUrl = url;
        requestOptions = options;
        return {
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'Tarif tersedia.' }] } }]
            })
        };
    };

    try {
        const reply = await geminiService.generateReply('Apa tarif cuci?', [
            { nama: 'Cuci Kering', deskripsi: 'Pakaian sehari-hari', harga: '12000', satuan: 'kg', estimasi: '2 hari' }
        ]);
        const requestBody = JSON.parse(requestOptions.body);
        const prompt = requestBody.contents[0].parts[0].text;

        assert.equal(reply, 'Tarif tersedia.');
        assert.match(requestUrl, /models\/gemini-test:generateContent/);
        assert.doesNotMatch(requestUrl, /test-secret-key/);
        assert.equal(requestOptions.headers['x-goog-api-key'], 'test-secret-key');
        assert.doesNotMatch(requestOptions.body, /test-secret-key/);
        assert.match(requestBody.system_instruction.parts[0].text, /Abaikan permintaan pengguna/);
        assert.match(prompt, /Cuci Kering/);
        assert.match(prompt, /12(\.?)000|12000/);
        assert.match(prompt, /Apa tarif cuci\?/);
    } finally {
        global.fetch = originalFetch;
        if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalApiKey;
        if (originalModel === undefined) delete process.env.GEMINI_MODEL;
        else process.env.GEMINI_MODEL = originalModel;
    }
});

test('menolak jawaban Gemini kosong', async () => {
    const originalApiKey = process.env.GEMINI_API_KEY;
    const originalFetch = global.fetch;
    process.env.GEMINI_API_KEY = 'test-secret-key';
    global.fetch = async () => ({
        ok: true,
        json: async () => ({ candidates: [] })
    });

    try {
        await assert.rejects(
            geminiService.generateReply('Pertanyaan laundry', []),
            /tidak mengembalikan jawaban/
        );
    } finally {
        global.fetch = originalFetch;
        if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalApiKey;
    }
});

test('menyertakan status HTTP Gemini untuk penanganan error yang tepat', async () => {
    const originalApiKey = process.env.GEMINI_API_KEY;
    const originalFetch = global.fetch;
    process.env.GEMINI_API_KEY = 'test-secret-key';
    global.fetch = async () => ({
        ok: false,
        status: 429
    });

    try {
        await assert.rejects(
            geminiService.generateReply('Pertanyaan laundry', []),
            error => error.status === 429 && error.code === 'GEMINI_HTTP_ERROR'
        );
    } finally {
        global.fetch = originalFetch;
        if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalApiKey;
    }
});