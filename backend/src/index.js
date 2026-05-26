const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const rawCorsOrigins = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5500,http://localhost:3000';
const allowedOrigins = rawCorsOrigins.split(',').map(s => s.trim());

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Sert les fichiers depuis frontend-public
app.use(express.static(path.join(__dirname, '../../frontend-public')));
app.use('/admin', express.static(path.join(__dirname, '../../frontend-admin/pages')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/me', express.static(path.join(__dirname, '../../frontend-public/cliente/profile.html')));


const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);


const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/client');
const reservationRoutes = require('./routes/reservation');
const adminRoutes = require('./routes/admin');
const galerieRoutes = require('./routes/galerie');
const paiementRoutes = require('./routes/paiement');
const { getDashboardStats } = require('./controllers/adminController');
const { verifyAdminToken } = require('./controllers/authController');
const { createPaymentIntent } = require('./controllers/payementController');const excursionRoutes = require('./routes/excursions');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/galerie', galerieRoutes);
app.use('/api/paiement', paiementRoutes);
app.use('/api/client', clientRoutes);
app.get('/', (req, res) => {
    res.json({ message: 'API Ecotripswomen is running' });
});

// Cette route doit exister
app.get('/api/admin/dashboard-stats',verifyAdminToken, getDashboardStats);


app.get('/api/paiement/create-intent',createPaymentIntent );
app.use('/api/excursions', excursionRoutes);
app.get('/api/me',reservationRoutes );
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});