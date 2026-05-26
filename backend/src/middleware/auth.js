const jwt = require('jsonwebtoken');

// Vérifier token client (pour les réservations)
const verifyClientToken = async (req, res, next) => {
    console.log('🔍 1. Middleware verifyClientToken appelé');
    const authHeader = req.headers.authorization;
    console.log('🔍 2. Authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ 3. Token manquant');
        return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔍 4. Token extrait:', token.substring(0, 20) + '...');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔍 5. Token décodé:', decoded);
        
        if (decoded.role !== 'client') {
            console.log('❌ 6. Rôle incorrect:', decoded.role);
            return res.status(403).json({ success: false, message: 'Accès réservé aux clients' });
        }

        req.clientId = decoded.id;
        console.log('✅ 7. clientId défini:', req.clientId);
        next();
    } catch (error) {
        console.log('❌ 8. Erreur JWT:', error.message);
        return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
    }
};

module.exports = { verifyClientToken };