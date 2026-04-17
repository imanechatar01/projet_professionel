const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyAdminToken, getCurrentAdmin } = require('../controllers/authController');

// Retourne l'admin connecté après vérification du JWT
router.get('/me', verifyAdminToken, getCurrentAdmin);

// Liste simple des clientes pour le dashboard admin
router.get('/clientes', verifyAdminToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nom, prenom, email, telephone, created_at FROM clientes ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            clientes: result.rows,
        });
    } catch (error) {
        console.error('Erreur récupération clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
        });
    }
});


module.exports = router;