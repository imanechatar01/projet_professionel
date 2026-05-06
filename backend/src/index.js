const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
// Configure CORS: allow multiple origins from env or default local origins
// Support both CORS_ORIGINS or legacy ALLOWED_ORIGINS env var
const rawCorsOrigins = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5501';
const allowedOrigins = rawCorsOrigins.split(',').map(s => s.trim());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ⭐ Sert les fichiers statiques
app.use(express.static(path.join(__dirname, '../../frontend-public')));
app.use('/admin', express.static(path.join(__dirname, '../../frontend-admin/pages')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
const clientRoutes = require('./routes/client');
const reservationRoutes = require('./routes/reservation');
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/reservations', reservationRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});