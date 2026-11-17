function normalizeIndonesianPhone(value) {
    return value.replace(/[()\s-]/g, '');
}

function isValidIndonesianPhone(value) {
    return /^(?:\+62|62|0)8[1-9]\d{6,10}$/.test(value);
}

module.exports = { normalizeIndonesianPhone, isValidIndonesianPhone };
