const express = require('express');
const chatController = require('../controllers/chat.controller');
const validateChatInput = require('../middlewares/validateChatInput.middleware');

const router = express.Router();

router.post('/chat', validateChatInput, chatController.postChat);

module.exports = router;