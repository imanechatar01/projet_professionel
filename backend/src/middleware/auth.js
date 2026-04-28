const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Accès refusé" });
    }

    if (token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch {
        res.status(401).json({ message: "Token invalide" });
    }
};