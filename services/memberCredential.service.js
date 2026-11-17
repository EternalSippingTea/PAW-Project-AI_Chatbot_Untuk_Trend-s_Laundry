const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto');

const KEY_LENGTH = 64;

function deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
        scryptCallback(password, salt, KEY_LENGTH, (error, key) => {
            if (error) return reject(error);
            return resolve(key);
        });
    });
}

async function hashPassword(password) {
    const salt = randomBytes(16);
    const key = await deriveKey(password, salt);
    return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function verifyPassword(password, encodedHash) {
    if (typeof encodedHash !== 'string') return false;
    const [algorithm, saltHex, keyHex] = encodedHash.split('$');
    if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;

    const salt = Buffer.from(saltHex, 'hex');
    const expectedKey = Buffer.from(keyHex, 'hex');
    if (salt.length !== 16 || expectedKey.length !== KEY_LENGTH) return false;

    const actualKey = await deriveKey(password, salt);
    return timingSafeEqual(actualKey, expectedKey);
}

module.exports = { hashPassword, verifyPassword };