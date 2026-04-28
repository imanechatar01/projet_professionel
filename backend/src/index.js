const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Importer les routes (selon votre structure)
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Utiliser les routes
app.use('/api/auth', authRoutes);      // Pour les routes d'authentification
app.use('/api/admin', adminRoutes);    // Pour les routes admin

// Route de test
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Ecotripswomen - Authentification Admin',
        version: '1.0'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

const galerieRoutes = require('./routes/galerie');

app.use('/api/galerie', galerieRoutes);

// rendre les images accessibles
app.use('/uploads', express.static('uploads'));