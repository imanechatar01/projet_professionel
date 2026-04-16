const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/authController');

// Route login admin
router.post('/login', adminLogin);
    
module.exports = router;