const produkModel = require('../models/produkModel');
const pesananModel = require('../models/pesananModel');
const config = require('../config/appconfig');

module.exports = {
    getStatus: (req, res) => {
        res.status(200).json({ status: "ok", environment: config.ENV, uptime: process.uptime() });
    },

    // --- CRUD PRODUK ---
    getProduk: async (req, res) => {
        try {
            const data = await produkModel.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: "Gagal mengambil data produk" });
        }
    },
    getProdukById: async (req, res) => {
        try {
            const data = await produkModel.getById(req.params.id);
            if (!data) return res.status(404).json({ error: "Produk tidak ditemukan" });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: "Gagal mengambil detail produk" });
        }
    },
    postProduk: async (req, res) => {
        try {
            const newProduk = await produkModel.create(req.body);
            res.status(201).json({ message: "Produk berhasil ditambahkan", data: newProduk });
        } catch (error) {
            res.status(500).json({ error: "Gagal menambah produk" });
        }
    },
    putProduk: async (req, res) => {
        try {
            const updated = await produkModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ error: "Produk tidak ditemukan" });
            res.status(200).json({ message: "Produk berhasil diperbarui", data: updated });
        } catch (error) {
            console.error("Gagal memperbarui produk:", error);
            res.status(500).json({ error: "Gagal memperbarui produk" });
        }
    },
    deleteProduk: async (req, res) => {
        try {
            const rowCount = await produkModel.delete(req.params.id);
            if (rowCount === 0) return res.status(404).json({ error: "Produk tidak ditemukan" });
            res.status(200).json({ message: "Produk berhasil dihapus" });
        } catch (error) {
            console.error("Gagal menghapus produk:", error);
            res.status(500).json({ error: "Gagal menghapus produk" });
        }
    },

    // --- CRUD PESANAN (UNTUK PEGAWAI/ADMIN) ---
    getAllPesanan: async (req, res) => {
        try {
            const data = await pesananModel.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: "Gagal mengambil data pesanan" });
        }
    },
    postPesanan: async (req, res) => {
        try {
            // Membuat kode invoice otomatis (contoh: TLK-1001)
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const kode_invoice = `TLK-${randomNum}`;
            
            const payload = { kode_invoice, ...req.body };
            const newPesanan = await pesananModel.create(payload);
            res.status(201).json({ message: "Pesanan berhasil dibuat", data: newPesanan });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Gagal membuat pesanan" });
        }
    },
    putPesanan: async (req, res) => {
        try {
            const updated = await pesananModel.update(req.params.kodeInvoice, req.body);
            if (!updated) return res.status(404).json({ error: "Pesanan tidak ditemukan" });
            res.status(200).json({ message: "Pesanan berhasil diperbarui", data: updated });
        } catch (error) {
            console.error("Gagal memperbarui pesanan:", error);
            res.status(500).json({ error: "Gagal memperbarui pesanan" });
        }
    },
    deletePesanan: async (req, res) => {
        try {
            const rowCount = await pesananModel.delete(req.params.kodeInvoice);
            if (rowCount === 0) return res.status(404).json({ error: "Pesanan tidak ditemukan" });
            res.status(200).json({ message: "Pesanan berhasil dihapus" });
        } catch (error) {
            console.error("Gagal menghapus pesanan:", error);
            res.status(500).json({ error: "Gagal menghapus pesanan" });
        }
    },

    // --- CHATBOT & STATUS ---
    getStatusPesanan: async (req, res) => {
        try {
            const pesanan = await pesananModel.getByKodeInvoice(req.params.kodeInvoice);
            if (!pesanan) return res.status(404).json({ error: "Invoice tidak ditemukan" });
            res.status(200).json(pesanan);
        } catch(error) {
            res.status(500).json({ error: "Terjadi kesalahan server" });
        }
    },
    postChatbot: async (req, res) => {
        const pesan = req.body && req.body.pesan;
        let jawaban = "Maaf, saya tidak mengerti. Ketik 'layanan' untuk melihat produk, atau masukkan 'kode invoice' (contoh: TLK-1234) untuk cek status.";
        let dikenali = false;

        if (typeof pesan !== "string" || !pesan.trim()) return res.status(400).json({ error: "Pesan kosong" });
        const pesanLower = pesan.trim().toLowerCase();

        if (pesanLower.includes("jam buka") || pesanLower.includes("buka jam")) {
            jawaban = "Jam buka kami: Senin - Sabtu: 08.00 - 20.00, Minggu: 09.00 - 17.00.";
            dikenali = true;
        } else if (pesanLower.includes("tarif") || pesanLower.includes("harga") || pesanLower.includes("layanan")) {
            try {
                const dataProduk = await produkModel.getAll();
                if (dataProduk.length > 0) {
                    jawaban = "Berikut daftar tarif kami:\n" + dataProduk.map(p => `- ${p.nama}: Rp${Number(p.harga).toLocaleString('id-ID')}/${p.satuan} (Est: ${p.estimasi})`).join("\n");
                } else {
                    jawaban = "Saat ini data layanan belum tersedia di sistem.";
                }
                dikenali = true;
            } catch (err) {
                jawaban = "Maaf, sistem sedang kesulitan mengambil data harga.";
            }
        }
        res.status(200).json({ jawaban, dikenali });
    }
};