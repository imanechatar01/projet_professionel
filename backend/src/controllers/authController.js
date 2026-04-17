const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// ========== CONNEXION ADMIN AVEC VÉRIFICATION BDD ==========
const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email et mot de passe requis' 
        });
    }

    try {
        // 1. Vérifier si l'admin existe dans la base de données
        const result = await pool.query(
            'SELECT * FROM admins WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const admin = result.rows[0];

        // 2. Vérifier le mot de passe (comparer avec le hash)
        let passwordValid = false;
        
        // Si le mot de passe est en clair dans la BDD (temporaire)
        if (admin.password_hash === 'admin123_temporaire' && password === 'admin123') {
            passwordValid = true;
        } else {
            // Normalement on compare avec bcrypt
            passwordValid = await bcrypt.compare(password, admin.password_hash);
        }

        if (!passwordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        // 3. Générer le token JWT
        const token = jwt.sign(
            { 
                id: admin.id, 
                email: admin.email, 
                nom: admin.nom,
                role: 'admin' 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 4. Retourner la réponse
        res.json({
            success: true,
            token: token,
            admin: {
                id: admin.id,
                nom: admin.nom,
                email: admin.email,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error('Erreur login admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur' 
        });
    }
};

// ========== VÉRIFIER TOKEN ADMIN (Middleware) ==========
const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token manquant' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès réservé aux administrateurs' 
            });
        }

        const result = await pool.query(
            'SELECT id, nom, email FROM admins WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Admin non trouvé' 
            });
        }

        req.admin = result.rows[0];
        next();
        
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token invalide ou expiré' 
        });
    }
};

// ========== RÉCUPÉRER L'ADMIN CONNECTÉ ==========
const getCurrentAdmin = async (req, res) => {
    res.json({
        success: true,
        admin: req.admin
    });
};

module.exports = {
    adminLogin,
    verifyAdminToken,
    getCurrentAdmin
};