const { db } = require('../config/appconfig');

module.exports = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM produk ORDER BY id ASC');
        return result.rows;
    },
    getById: async (id) => {
        const result = await db.query('SELECT * FROM produk WHERE id = $1', [id]);
        return result.rows[0];
    },
    create: async (data) => {
        const { nama, deskripsi, harga, satuan, estimasi } = data;
        const result = await db.query(
            'INSERT INTO produk (nama, deskripsi, harga, satuan, estimasi) VALUES ($1, $2, $3, $4, $5) RETURNING ',
            [nama, deskripsi, harga, satuan, estimasi]
        );
        return result.rows[0];
    },
    update: async (id, data) => {
        const { nama, deskripsi, harga, satuan, estimasi } = data;
        const result = await db.query(
            'UPDATE produk SET nama=$1, deskripsi=$2, harga=$3, satuan=$4, estimasi=$5 WHERE id=$6 RETURNING',
            [nama, deskripsi, harga, satuan, estimasi, id]
        );
        return result.rows[0];
    },
    delete: async (id) => {
        const result = await db.query('DELETE FROM produk WHERE id = $1', [id]);
        return result.rowCount;
    }
};