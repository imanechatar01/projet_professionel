// backend/src/routes/reservations.js

const express = require('express');
const router = express.Router();

const {
    createReservation,
    getMyReservations,
    getAllReservations,
    updateReservationStatus,
    cancelReservation,
    confirmReservation,
    getReservationStats
} = require('../controllers/reservationController');

const { verifyClientToken } = require('../middleware/auth');
const { verifyAdminToken } = require('../controllers/authController');

// Routes client (protégées)
router.post('/', verifyClientToken, createReservation);
router.get('/me', verifyClientToken, getMyReservations);

// Routes admin
router.get('/', verifyAdminToken, getAllReservations);
router.put('/:id/status', verifyAdminToken, updateReservationStatus);
router.delete('/:id', verifyAdminToken, cancelReservation);
router.put('/:id/confirm', verifyAdminToken, confirmReservation);
router.get('/stats', verifyAdminToken, getReservationStats);
module.exports = router;