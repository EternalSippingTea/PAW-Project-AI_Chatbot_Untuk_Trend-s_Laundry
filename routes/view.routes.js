const express = require('express');

const router = express.Router();

router.get('/', (req, res) => res.render('home', { activePage: 'home' }));
router.get('/pemesanan', (req, res) => res.render('pemesanan', { activePage: 'pemesanan' }));
router.get('/admin', (req, res) => res.render('admin', { activePage: 'admin' }));

module.exports = router;