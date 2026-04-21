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
const clientRoutes = require('./routes/client');

// Utiliser les routes
app.use('/api/auth', authRoutes);      // Pour les routes d'authentification
app.use('/api/admin', adminRoutes);    // Pour les routes admin
app.use('/api/client', clientRoutes);  // Pour les routes client


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



