const express = require('express');
const router = express.Router();
const { verifyClientToken } = require('../middleware/auth');
const { verifyAdminToken } = require('../controllers/authController');
const {
    createMessage,
    getMyMessages,
    getAllMessages,
    markAsRead,
    replyToMessage
} = require('../controllers/messageController');

// Routes client (protégées par token client)
router.post('/', verifyClientToken, createMessage);
router.get('/me', verifyClientToken, getMyMessages);

// Routes admin (protégées par token admin)
router.get('/', verifyAdminToken, getAllMessages);
router.put('/:id/read', verifyAdminToken, markAsRead);
router.post('/:id/reply', verifyAdminToken, replyToMessage);

module.exports = router;