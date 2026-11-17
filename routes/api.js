const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const adminController = require('../controllers/admin.controller');
const memberController = require('../controllers/member.controller');
const memberAdminController = require('../controllers/member-admin.controller');
const produkController = require('../controllers/produk.controller');
const pesananController = require('../controllers/pesanan.controller');
const requireAdminAuth = require('../middlewares/requireAdminAuth.middleware');
const requireMemberAuth = require('../middlewares/requireMemberAuth.middleware');
const {
    validateCreatePesanan,
    validateUpdatePesanan
} = require('../middlewares/validatePesananInput.middleware');
const {
    validateRegister,
    validateLogin
} = require('../middlewares/validateMemberInput.middleware');

router.get('/status', healthController.getStatus);
router.get('/pesanan/:kodeInvoice', pesananController.getStatusPesanan);

router.post('/admin/login', adminController.login);
router.post('/admin/logout', requireAdminAuth, adminController.logout);
router.get('/admin/session', requireAdminAuth, adminController.getSession);
router.get('/admin/pesanan/:kodeInvoice', requireAdminAuth, pesananController.getPesananAdmin);
router.post('/admin/pesanan', requireAdminAuth, validateCreatePesanan, pesananController.postPesananAdmin);
router.get('/admin/members', requireAdminAuth, memberAdminController.getMembers);

router.post('/member/register', validateRegister, memberController.register);
router.post('/member/login', validateLogin, memberController.login);
router.get('/member/session', requireMemberAuth, memberController.getSession);
router.post('/member/logout', requireMemberAuth, memberController.logout);

// CRUD Produk
router.get('/produk', produkController.getProduk);
router.get('/produk/:id', produkController.getProdukById);
router.post('/produk', requireAdminAuth, produkController.postProduk);
router.put('/produk/:id', requireAdminAuth, produkController.putProduk);
router.delete('/produk/:id', requireAdminAuth, produkController.deleteProduk);

// CRUD Pesanan (Untuk Pegawai/Admin)
router.get('/pesanan', requireAdminAuth, pesananController.getAllPesanan);
router.post('/pesanan', requireMemberAuth, validateCreatePesanan, pesananController.postPesananPelanggan);
router.put('/pesanan/:kodeInvoice', requireAdminAuth, validateUpdatePesanan, pesananController.putPesanan);
router.delete('/pesanan/:kodeInvoice', requireAdminAuth, pesananController.deletePesanan);

