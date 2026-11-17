const produkService = require('../services/produk.service');
const geminiService = require('../services/gemini.service');
const { GeminiConfigurationError } = require('../config/gemini');

module.exports = {
    postChat: async (req, res) => {
        let products;
        try {
            products = await produkService.getAll();
        } catch (error) {
            console.error('Gagal memuat konteks produk untuk chatbot:', error);
            return res.status(500).json({
                success: false,
                error: 'Data layanan sedang tidak dapat diakses. Silakan coba lagi.'
            });
        }

        try {
            const reply = await geminiService.generateReply(req.body.message, products);
            return res.status(200).json({
                success: true,
                data: { reply }
            });
        } catch (error) {
            console.error('Gagal memproses permintaan chatbot:', error.message, error.code || 'UNKNOWN_ERROR');
            const status = error instanceof GeminiConfigurationError ? 503 : 502;
            let errorMessage = 'Asisten AI sedang tidak tersedia. Silakan coba beberapa saat lagi.';

            if (error.status === 400) {
                errorMessage = 'Gemini menolak konfigurasi permintaan. Periksa API key dan nama model di file .env.';
            } else if (error.status === 401 || error.status === 403) {
                errorMessage = 'Akses Gemini ditolak. Periksa API key dan akses Generative Language API.';
            } else if (error.status === 404) {
                errorMessage = 'Model Gemini tidak ditemukan. Periksa nilai GEMINI_MODEL di file .env.';
            } else if (error.status === 429) {
                errorMessage = 'Kuota Gemini sedang habis atau terbatas. Periksa kuota akun Google AI Studio.';
            } else if (error.status === 503) {
                errorMessage = 'Gemini sedang mengalami lonjakan permintaan. Silakan coba lagi beberapa saat.';
            }

            return res.status(status).json({
                success: false,
                error: status === 503
                    ? 'Asisten AI belum dikonfigurasi. Silakan hubungi pengelola.'
                    : errorMessage
            });
        }
    }
};