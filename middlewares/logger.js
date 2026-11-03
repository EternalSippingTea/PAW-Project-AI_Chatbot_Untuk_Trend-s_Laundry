// Middleware untuk mencatat log setiap request
const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDirectory, 'logger.md');

const logger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;
        console.log(message);
        fs.mkdir(logDirectory, { recursive: true }, (mkdirError) => {
            if (mkdirError) {
                console.error('Gagal membuat folder log:', mkdirError);
                return;
            }

            fs.appendFile(logFile, `${message}\n`, (writeError) => {
                if (writeError) console.error('Gagal menulis file log:', writeError);
            });
        });
    });
    next();
};

module.exports = logger;