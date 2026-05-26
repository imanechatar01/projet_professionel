const express = require('express');
const router = express.Router();
const { 
    clientRegister, 
    clientLogin, 
    
    verifyClientToken 
} = require('../controllers/clientAuthController');

const{
    getClientProfile,
}= require('../controllers/clientController');

const { 
    getClientMessages,
    sendClientMessage
} = require('../controllers/clientController');
// Routes publiques
router.post('/register', clientRegister);
router.post('/login', clientLogin);

// Routes protégées
router.get('/profile', verifyClientToken, getClientProfile);



router.get('/messages', verifyClientToken, getClientMessages);
router.post('/messages', verifyClientToken, sendClientMessage);

module.exports = router;