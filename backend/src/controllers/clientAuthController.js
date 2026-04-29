const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Inscription cliente
const clientRegister = async (req, res) => {
    const { nom, prenom, email, telephone, password } = req.body;

    if (!nom || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nom, email et mot de passe requis' 
        });
    }

    try {
        // Vérifier si email existe déjà
        const existing = await pool.query(
            'SELECT * FROM clientes WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cet email est déjà utilisé' 
            });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer le client
        const result = await pool.query(
            `INSERT INTO clientes (nom, prenom, email, telephone, password_hash) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, nom, prenom, email, telephone`,
            [nom, prenom, email, telephone, hashedPassword]
        );

        const client = result.rows[0];

        // Générer token JWT
        const token = jwt.sign(
            { id: client.id, email: client.email, role: 'client' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            client: {
                id: client.id,
                nom: client.nom,
                prenom: client.prenom,
                email: client.email,
                telephone: client.telephone
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Connexion cliente
const clientLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email et mot de passe requis' 
        });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM clientes WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        const client = result.rows[0];
        const validPassword = await bcrypt.compare(password, client.password_hash);

        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        const token = jwt.sign(
            { id: client.id, email: client.email, role: 'client' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            client: {
                id: client.id,
                nom: client.nom,
                prenom: client.prenom,
                email: client.email,
                telephone: client.telephone
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Récupérer profil client (protégé)
const getClientProfile = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nom, prenom, email, telephone, created_at FROM clientes WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Client non trouvé' 
            });
        }

        res.json({ success: true, client: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Middleware vérification token client
const verifyClientToken = async (req, res, next) => {
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
        
        if (decoded.role !== 'client') {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès réservé aux clients' 
            });
        }

        req.user = decoded;
        next();
        
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token invalide ou expiré' 
        });
    }
};

module.exports = {
    clientRegister,
    clientLogin,
    getClientProfile,
    verifyClientToken
};