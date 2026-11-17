module.exports = (req, res, next) => {
    if (!req.session || !req.session.adminUsername) {
        return res.status(401).json({
            success: false,
            error: 'Silakan login sebagai admin.'
        });
    }

    return next();
};