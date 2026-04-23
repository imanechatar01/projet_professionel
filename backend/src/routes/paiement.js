const express = require('express');
const router = express.Router();
const { verifyClientToken } = require('../middleware/auth');
const { 
    createPaymentIntent, 
    handleWebhook,
    checkPaymentStatus 
} = require('../controllers/paiementController');

router.post('/create-intent', verifyClientToken, createPaymentIntent);
router.get('/status/:reservation_id', verifyClientToken, checkPaymentStatus);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;