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

app.use(cors({
    origin: function (origin, callback) {
        // allow non-browser requests like curl or Postman when no origin
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ⭐ Sert les fichiers depuis ton dossier frontend-public (sans les déplacer)
app.use(express.static(path.join(__dirname, '../../frontend-public')));

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