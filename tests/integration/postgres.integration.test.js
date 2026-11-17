require('dotenv').config();
const assert = require('node:assert/strict');
const test = require('node:test');

test('connects to PostgreSQL and reads the existing products table', async () => {
    const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_NAME'];
    const missingVariables = requiredVariables.filter(name => !process.env[name]);
    assert.deepEqual(
        missingVariables,
        [],
        `Configure ${missingVariables.join(', ')} in .env before running integration tests.`
    );

    const { sequelize, Produk } = require('../../models');
    try {
        await sequelize.authenticate();
        const products = await Produk.findAll({
            attributes: ['id', 'nama'],
            limit: 1
        });
        assert.ok(Array.isArray(products));
    } finally {
        await sequelize.close();
    }
});