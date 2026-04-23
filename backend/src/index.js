const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⭐ Sert les fichiers depuis ton dossier frontend-public (sans les déplacer)
app.use(express.static(path.join(__dirname, '../../frontend-public')));

// Routes API
const clientRoutes = require('./routes/client');
const reservationRoutes = require('./routes/reservation');
const paiementRoutes = require('./routes/paiement');

app.use('/api/client', clientRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/paiement', paiementRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});