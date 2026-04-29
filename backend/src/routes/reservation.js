// backend/src/routes/reservations.js

const express = require('express');
const router = express.Router();
const {
    createReservation,
    getMyReservations,
    getAllReservations,
    updateReservationStatus
} = require('../controllers/reservationController');
const { verifyClientToken } = require('../middleware/auth');
const { verifyAdminToken } = require('../controllers/authController');

// Routes client (protégées par token)
router.post('/', verifyClientToken, createReservation);
router.get('/me', verifyClientToken, getMyReservations);

// Routes admin
router.get('/', verifyAdminToken, getAllReservations);
router.put('/:id/status', verifyAdminToken, updateReservationStatus);

module.exports = router;