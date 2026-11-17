const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.get('/status', apiController.getStatus);
router.post('/chatbot', apiController.postChatbot);
router.get('/pesanan/:kodeInvoice', apiController.getStatusPesanan);

// CRUD Produk
router.get('/produk', apiController.getProduk);
router.get('/produk/:id', apiController.getProdukById);
router.post('/produk', apiController.postProduk);
router.put('/produk/:id', apiController.putProduk);
router.delete('/produk/:id', apiController.deleteProduk);

// CRUD Pesanan (Untuk Pegawai/Admin)
router.get('/pesanan', apiController.getAllPesanan);
router.post('/pesanan', apiController.postPesanan);
router.put('/pesanan/:kodeInvoice', apiController.putPesanan);
router.delete('/pesanan/:kodeInvoice', apiController.deletePesanan);

module.exports = router;


