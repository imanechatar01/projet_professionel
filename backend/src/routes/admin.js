const express = require('express');
const router = express.Router();
const { verifyAdminToken, getCurrentAdmin } = require('../controllers/authController');
const {
	getDashboardStats,
    getAdminClients,
    createAdminClient,
    updateAdminClient,
    deleteAdminClient,
    getAdminExcursions,
	createAdminReservation,
	deleteAdminReservation
} = require('../controllers/adminController');

//retourne l'admin connecté après vérification du JWT
router.get('/me', verifyAdminToken, getCurrentAdmin);

//New Dashboard Stats route
router.get('/dashboard-stats', verifyAdminToken, getDashboardStats);
router.get('/clients', verifyAdminToken, getAdminClients);
router.post('/clients', verifyAdminToken, createAdminClient);
router.put('/clients/:id', verifyAdminToken, updateAdminClient);
router.delete('/clients/:id', verifyAdminToken, deleteAdminClient);
router.get('/excursions', verifyAdminToken, getAdminExcursions);
router.post('/reservations', verifyAdminToken, createAdminReservation);
router.delete('/reservations/:id', verifyAdminToken, deleteAdminReservation);



module.exports = router;