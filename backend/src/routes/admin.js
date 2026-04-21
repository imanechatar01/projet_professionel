const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyAdminToken, getCurrentAdmin } = require('../controllers/authController');
const { getDashboardStats } = require('../controllers/adminController');

// Retourne l'admin connecté après vérification du JWT
router.get('/me', verifyAdminToken, getCurrentAdmin);

// New Dashboard Stats route
router.get('/dashboard-stats', verifyAdminToken, getDashboardStats);



module.exports = router;