const jwt = require('jsonwebtoken');

// Vérifier token client (pour les réservations)
const verifyClientToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Token manquant. Veuillez vous connecter.'
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

        // Ajouter l'ID du client à la requête
        req.clientId = decoded.id;
        next();
        
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré. Veuillez vous reconnecter.'
        });
    }
};

module.exports = { verifyClientToken };