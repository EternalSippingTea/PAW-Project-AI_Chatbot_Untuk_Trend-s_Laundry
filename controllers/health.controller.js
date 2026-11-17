const config = require('../config');

module.exports = {
    getStatus: (req, res) => {
        res.status(200).json({
            status: 'ok',
            environment: config.ENV,
            uptime: process.uptime()
        });
    }
};