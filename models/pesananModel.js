const { db } = require('../config/appconfig');

module.exports = {
    getAll: async () => {
        const result = await db.query('SELECT * FROM pesanan ORDER BY kode_invoice DESC');
        return result.rows;
    },
    getByKodeInvoice: async (kode) => {
        const result = await db.query('SELECT * FROM pesanan WHERE kode_invoice = $1', [kode.trim().toUpperCase()]);
        return result.rows[0];
    },
    create: async (data) => {
        const { kode_invoice, nama_pelanggan, nomor_hp, alamat, layanan, catatan, estimasi } = data;
        const result = await db.query(
            'INSERT INTO pesanan (kode_invoice, nama_pelanggan, nomor_hp, alamat, layanan, catatan, status, estimasi) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [kode_invoice, nama_pelanggan, nomor_hp, alamat, layanan, catatan, 'Diterima', estimasi]
        );
        return result.rows[0];
    },
    update: async (kode, data) => {
        const { nama_pelanggan, nomor_hp, alamat, layanan, status, catatan } = data;
        const result = await db.query(
            'UPDATE pesanan SET nama_pelanggan=$1, nomor_hp=$2, alamat=$3, layanan=$4, status=$5, catatan=$6 WHERE kode_invoice=$7 RETURNING *',
            [nama_pelanggan, nomor_hp, alamat, layanan, status, catatan, kode]
        );
        return result.rows[0];
    },
    delete: async (kode) => {
        const result = await db.query('DELETE FROM pesanan WHERE kode_invoice = $1', [kode]);
        return result.rowCount;
    }
};