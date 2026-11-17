require('dotenv').config();

class GeminiConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GeminiConfigurationError';
        this.code = 'GEMINI_CONFIGURATION_ERROR';
    }
}

module.exports = {
    getApiKey() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new GeminiConfigurationError('GEMINI_API_KEY belum dikonfigurasi.');
        }
        return apiKey;
    },
    getModel() {
        const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
        if (!/^[a-zA-Z0-9._-]+$/.test(model)) {
            throw new GeminiConfigurationError('GEMINI_MODEL tidak valid.');
        }
        return model;
    },
    GeminiConfigurationError
};