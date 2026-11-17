module.exports = (req, res, next) => {
    if (!req.session || !req.session.memberId) {
        return res.status(401).json({
            success: false,
            error: 'Silakan login atau daftar sebagai member untuk melanjutkan.'
        });
    }

    return next();
};