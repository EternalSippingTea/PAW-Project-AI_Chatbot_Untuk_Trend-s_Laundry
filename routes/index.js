const express = require('express');
const router = express.Router();
const viewRoutes = require('./view.routes');
const apiRoutes = require('./api');
const chatRoutes = require('./chat.routes');

router.use('/', viewRoutes);
router.use('/api', apiRoutes);
router.use('/api', chatRoutes);

module.exports = router;