const express = require('express');
const router = express.Router();
const { 
    clientRegister, 
    clientLogin, 
    getClientProfile,
    verifyClientToken 
} = require('../controllers/clientAuthController');

// Routes publiques
router.post('/register', clientRegister);
router.post('/login', clientLogin);

// Routes protégées
router.get('/profile', verifyClientToken, getClientProfile);

module.exports = router;