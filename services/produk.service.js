const { Produk } = require('../models');
const toPlainObject = require('../utils/toPlainObject');

module.exports = {
    getAll: async () => {
        const products = await Produk.findAll({ order: [['id', 'ASC']] });
        return products.map(toPlainObject);
    },
    getById: async (id) => {
        return toPlainObject(await Produk.findByPk(id));
    },
    create: async (data) => {
        const produk = await Produk.create({
            nama: data.nama,
            deskripsi: data.deskripsi,
            harga: data.harga,
            satuan: data.satuan,
            estimasi: data.estimasi
        });
        return toPlainObject(produk);
    },
    update: async (id, data) => {
        const produk = await Produk.findByPk(id);
        if (!produk) return undefined;
        await produk.update({
            nama: data.nama,
            deskripsi: data.deskripsi,
            harga: data.harga,
            satuan: data.satuan,
            estimasi: data.estimasi
        });
        return toPlainObject(produk);
    },
    delete: async (id) => {
        const produk = await Produk.findByPk(id);
        if (!produk) return 0;
        await produk.destroy();
        return 1;
    }
};