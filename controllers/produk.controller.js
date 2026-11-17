const produkService = require('../services/produk.service');
const { validateProduk } = require('../middlewares/validateProdukInput.middleware');

module.exports = {
    getProduk: async (req, res) => {
        try {
            const data = await produkService.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: 'Gagal mengambil data produk' });
        }
    },
    getProdukById: async (req, res) => {
        try {
            const data = await produkService.getById(req.params.id);
            if (!data) return res.status(404).json({ error: 'Produk tidak ditemukan' });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: 'Gagal mengambil detail produk' });
        }
    },
    postProduk: async (req, res) => {
        try {
            const { isValid, errors, data } = validateProduk(req.body, false);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Periksa kembali data layanan yang dimasukkan.',
                    fields: errors
                });
            }
            const newProduk = await produkService.create(data);
            res.status(201).json({ success: true, message: 'Layanan berhasil ditambahkan', data: newProduk });
        } catch (error) {
            console.error('Gagal menambah produk:', error);
            res.status(500).json({ success: false, error: 'Gagal menambah layanan' });
        }
    },
    putProduk: async (req, res) => {
        try {
            const { isValid, errors, data } = validateProduk(req.body, true);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Periksa kembali data layanan yang dimasukkan.',
                    fields: errors
                });
            }
            const updated = await produkService.update(req.params.id, data);
            if (!updated) return res.status(404).json({ success: false, error: 'Layanan tidak ditemukan' });
            res.status(200).json({ success: true, message: 'Layanan berhasil diperbarui', data: updated });
        } catch (error) {
            console.error('Gagal memperbarui produk:', error);
            res.status(500).json({ success: false, error: 'Gagal memperbarui layanan' });
        }
    },
    deleteProduk: async (req, res) => {
        try {
            const rowCount = await produkService.delete(req.params.id);
            if (rowCount === 0) return res.status(404).json({ success: false, error: 'Layanan tidak ditemukan' });
            res.status(200).json({ success: true, message: 'Layanan berhasil dihapus' });
        } catch (error) {
            console.error('Gagal menghapus produk:', error);
            res.status(500).json({ success: false, error: 'Gagal menghapus layanan' });
        }
    }
};