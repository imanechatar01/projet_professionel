const express = require('express');
const router = express.Router();

// Route protégée - vérifier token
router.get('/me', (req, res) => {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token manquant' 
        });
    }
    
    res.json({ 
        success: true, 
        admin: { 
            id: 1, 
            nom: 'Salma Chairi', 
            email: 'salma@ecotripswomen.com' 
        }
    });
});

module.exports = router;