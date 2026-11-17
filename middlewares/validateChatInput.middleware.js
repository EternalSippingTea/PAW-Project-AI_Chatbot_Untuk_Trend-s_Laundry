const MAX_MESSAGE_LENGTH = 1000;

module.exports = (req, res, next) => {
    const message = req.body && req.body.message;
    if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
            success: false,
            error: 'Pesan tidak boleh kosong.'
        });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
            success: false,
            error: `Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter.`
        });
    }

    req.body.message = message.trim();
    return next();
};