const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const rawCorsOrigins = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5501';
const allowedOrigins = rawCorsOrigins.split(',').map(s => s.trim());

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sert les fichiers uploadés (images galerie)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Sert les fichiers depuis frontend-public
app.use(express.static(path.join(__dirname, '../../frontend-public')));

// Routes API
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/client');
const reservationRoutes = require('./routes/reservation');
const adminRoutes = require('./routes/admin');
const galerieRoutes = require('./routes/galerie');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/galerie', galerieRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});