const pesananService = require('../services/pesanan.service');
const produkService = require('../services/produk.service');
const memberService = require('../services/member.service');

async function createPesanan(req, res, status, memberId = null) {
    try {
        const products = await produkService.getAll();
        const product = products.find(item =>
            item.nama.toLocaleLowerCase('id-ID') === req.body.layanan.toLocaleLowerCase('id-ID')
        );
        if (!product) {
            return res.status(400).json({
                success: false,
                error: 'Layanan yang dipilih tidak tersedia.',
                fields: { layanan: 'Pilih layanan yang tersedia.' }
            });
        }

        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const payload = {
            ...req.body,
            kode_invoice: `TLK-${randomNum}`,
            member_id: memberId,
            layanan: product.nama,
            estimasi: product.estimasi,
            status
        };
        const newPesanan = await pesananService.create(payload);
        return res.status(201).json({
            success: true,
            message: 'Pesanan berhasil dibuat.',
            data: newPesanan
        });
    } catch (error) {
        console.error('Gagal membuat pesanan:', error);
        return res.status(500).json({
            success: false,
            error: 'Gagal membuat pesanan. Silakan coba lagi.'
        });
    }
}

module.exports = {
    getStatusPesanan: async (req, res) => {
        try {
            const pesanan = await pesananService.getByKodeInvoice(req.params.kodeInvoice);
            if (!pesanan) return res.status(404).json({ error: 'Invoice tidak ditemukan' });
            return res.status(200).json({
                kode_invoice: pesanan.kode_invoice,
                nama_pelanggan: pesanan.nama_pelanggan,
                status: pesanan.status,
                layanan: pesanan.layanan,
                berat_kg: pesanan.berat_kg ?? null,
                estimasi: pesanan.estimasi
            });
        } catch (error) {
            console.error('Gagal memeriksa status pesanan:', error);
            res.status(500).json({ error: 'Terjadi kesalahan server' });
        }
    },
    getPesananAdmin: async (req, res) => {
        try {
            const pesanan = await pesananService.getByKodeInvoice(req.params.kodeInvoice);
            if (!pesanan) return res.status(404).json({ error: 'Invoice tidak ditemukan' });
            return res.status(200).json(pesanan);
        } catch (error) {
            console.error('Gagal mengambil detail pesanan admin:', error);
            return res.status(500).json({ error: 'Gagal mengambil detail pesanan.' });
        }
    },
    getAllPesanan: async (req, res) => {
        try {
            const data = await pesananService.getAll();
            return res.status(200).json(data);
        } catch (error) {
            console.error('Gagal mengambil data pesanan:', error);
            return res.status(500).json({ error: 'Gagal mengambil data pesanan' });
        }
    },
    postPesananPelanggan: async (req, res) => {
        try {
            const member = await memberService.getById(req.session.memberId);
            if (!member) {
                return res.status(401).json({
                    success: false,
                    error: 'Sesi member tidak berlaku. Silakan login kembali.'
                });
            }
            req.body.nama_pelanggan = member.nama;
            req.body.nomor_hp = member.nomor_hp;
            return createPesanan(req, res, 'Antrian Masuk', member.id);
        } catch (error) {
            console.error('Gagal memeriksa akun member untuk pesanan:', error);
            return res.status(500).json({
                success: false,
                error: 'Akun member tidak dapat diperiksa. Silakan coba lagi.'
            });
        }
    },
    postPesananAdmin: (req, res) => createPesanan(req, res, req.body.status || 'Antrian Masuk'),
    putPesanan: async (req, res) => {
        try {
            if (Object.prototype.hasOwnProperty.call(req.body, 'layanan')) {
                const products = await produkService.getAll();
                const product = products.find(item =>
                    item.nama.toLocaleLowerCase('id-ID') === req.body.layanan.toLocaleLowerCase('id-ID')
                );
                if (!product) {
                    return res.status(400).json({
                        error: 'Layanan yang dipilih tidak tersedia.',
                        fields: { layanan: 'Pilih layanan yang tersedia.' }
                    });
                }
                req.body.layanan = product.nama;
            }

            const updated = await pesananService.update(req.params.kodeInvoice, req.body);
            if (!updated) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
            return res.status(200).json({ message: 'Pesanan berhasil diperbarui', data: updated });
        } catch (error) {
            console.error('Gagal memperbarui pesanan:', error);
            return res.status(500).json({ error: 'Gagal memperbarui pesanan' });
        }
    },
    deletePesanan: async (req, res) => {
        try {
            const rowCount = await pesananService.delete(req.params.kodeInvoice);
            if (rowCount === 0) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
            res.status(200).json({ message: 'Pesanan berhasil dihapus' });
        } catch (error) {
            console.error('Gagal menghapus pesanan:', error);
            res.status(500).json({ error: 'Gagal menghapus pesanan' });
        }
    }
};