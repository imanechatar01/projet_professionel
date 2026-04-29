const express = require('express');
const router = express.Router();
const { verifyAdminToken, getCurrentAdmin } = require('../controllers/authController');
const {
	getDashboardStats,
	getAdminClients,
	createAdminClient,
	getAdminExcursions,
	createAdminReservation,
	deleteAdminReservation
} = require('../controllers/adminController');

// Retourne l'admin connecté après vérification du JWT
router.get('/me', verifyAdminToken, getCurrentAdmin);

// New Dashboard Stats route
router.get('/dashboard-stats', verifyAdminToken, getDashboardStats);
router.get('/clients', verifyAdminToken, getAdminClients);
router.post('/clients', verifyAdminToken, createAdminClient);
router.get('/excursions', verifyAdminToken, getAdminExcursions);
router.post('/reservations', verifyAdminToken, createAdminReservation);
router.delete('/reservations/:id', verifyAdminToken, deleteAdminReservation);



module.exports = router;