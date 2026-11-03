const produkModel = require('../models/produkModel');
const pesananModel = require('../models/pesananModel');
const config = require('../config/appconfig');

module.exports = {
    getStatus: (req, res) => {
        res.status(200).json({
            status: "ok",
            aplikasi: config.APP_NAME,
            versi: "1.0.0",
            environment: config.ENV,
            uptimeDetik: Math.floor(process.uptime()),
            waktuServer: new Date().toISOString()
        });
    },

    getProduk: (req, res) => {
        const produk = produkModel.getAllProduk();
        res.status(200).json(produk);
    },

    getStatusPesanan: (req, res) => {
        const pesanan = pesananModel.getByKodeInvoice(req.params.kodeInvoice);
        if (!pesanan) {
            return res.status(404).json({ error: "Invoice tidak ditemukan" });
        }

        res.status(200).json(pesanan);
    },

    postChatbot: (req, res) => {
        const pesan = req.body && req.body.pesan;
        let jawaban = "Maaf, saya tidak mengerti. Silakan hubungi staf kami.";
        let dikenali = false;

        if (typeof pesan !== "string" || !pesan.trim()) {
            return res.status(400).json({ error: "Pesan tidak boleh kosong" });
        }

        const pesanLower = pesan.trim().toLowerCase();
        if (pesanLower.includes("jam buka") || pesanLower.includes("buka jam")) {
            jawaban = "Jam buka kami: Senin - Sabtu: 08.00 - 20.00, Minggu: 09.00 - 17.00.";
            dikenali = true;
        } else if (pesanLower.includes("tarif") || pesanLower.includes("harga")) {
            jawaban = "Tarif kami mulai dari Rp 6.000/kg (Cuci Kering) hingga Rp 12.000/kg (Cuci Express).";
            dikenali = true;
        }

        res.status(200).json({ jawaban, dikenali });
    }
};