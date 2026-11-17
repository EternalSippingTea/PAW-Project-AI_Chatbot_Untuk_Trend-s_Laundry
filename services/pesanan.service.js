const { Pesanan } = require('../models');
const toPlainObject = require('../utils/toPlainObject');

module.exports = {
    getAll: async () => {
        const orders = await Pesanan.findAll({ order: [['kode_invoice', 'DESC']] });
        return orders.map(toPlainObject);
    },
    getByKodeInvoice: async (kode) => {
        const pesanan = await Pesanan.findByPk(kode.trim().toUpperCase());
        return toPlainObject(pesanan);
    },
    create: async (data) => {
        const pesanan = await Pesanan.create({
            kode_invoice: data.kode_invoice,
            member_id: data.member_id || null,
            nama_pelanggan: data.nama_pelanggan,
            nomor_hp: data.nomor_hp,
            alamat: data.alamat,
            layanan: data.layanan,
            catatan: data.catatan,
            status: data.status || 'Antrian Masuk',
            estimasi: data.estimasi,
            berat_kg: data.berat_kg || null
        });
        return toPlainObject(pesanan);
    },
    update: async (kode, data) => {
        const pesanan = await Pesanan.findByPk(kode);
        if (!pesanan) return undefined;
        const fields = ['nama_pelanggan', 'nomor_hp', 'alamat', 'layanan', 'status', 'catatan', 'berat_kg'];
        const updates = Object.fromEntries(
            fields
                .filter(field => Object.prototype.hasOwnProperty.call(data, field))
                .map(field => [field, data[field]])
        );
        await pesanan.update(updates);
        return toPlainObject(pesanan);
    },
    delete: async (kode) => {
        const pesanan = await Pesanan.findByPk(kode);
        if (!pesanan) return 0;
        await pesanan.destroy();
        return 1;
    }
};