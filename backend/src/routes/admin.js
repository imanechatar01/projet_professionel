const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { verifyAdminToken, getCurrentAdmin } = require('../controllers/authController');
const {
	getDashboardStats,
    getAdminClients,
    createAdminClient,
    updateAdminClient,
    deleteAdminClient,
    getAdminExcursions,
    createAdminExcursion,
    updateAdminExcursion,
    deleteAdminExcursion,
    deleteAdminExcursionRecursive,
	createAdminReservation,
	deleteAdminReservation
} = require('../controllers/adminController');

// Retourne l'admin connecté après vérification du JWT
router.get('/me', verifyAdminToken, getCurrentAdmin);

// New Dashboard Stats route
router.get('/dashboard-stats', verifyAdminToken, getDashboardStats);
router.get('/clients', verifyAdminToken, getAdminClients);
router.post('/clients', verifyAdminToken, createAdminClient);
router.put('/clients/:id', verifyAdminToken, updateAdminClient);
router.delete('/clients/:id', verifyAdminToken, deleteAdminClient);
//pour les voyages
router.get('/excursions', verifyAdminToken, getAdminExcursions);
router.post('/excursions', verifyAdminToken, upload.single('image'), createAdminExcursion);
router.put('/excursions/:id', verifyAdminToken, upload.single('image'), updateAdminExcursion);
router.delete('/excursions/:id', verifyAdminToken, deleteAdminExcursion);
router.delete('/excursions/:id/recursive', verifyAdminToken, deleteAdminExcursionRecursive);
//pour les reservations 
router.post('/reservations', verifyAdminToken, createAdminReservation);
router.delete('/reservations/:id', verifyAdminToken, deleteAdminReservation);



module.exports = router;