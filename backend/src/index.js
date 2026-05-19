const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   CORS
========================= */

const rawCorsOrigins =
  process.env.CORS_ORIGINS ||
  process.env.ALLOWED_ORIGINS ||
  "http://127.0.0.1:5500,http://localhost:3000,http://localhost:5173";

const allowedOrigins = rawCorsOrigins.split(",").map((s) => s.trim());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* =========================
   MIDDLEWARES
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
========================= */

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Sert les fichiers depuis frontend-public
app.use(express.static(path.join(__dirname, "../../frontend-public")));

// Sert les fichiers admin
app.use(
  "/admin",
  express.static(path.join(__dirname, "../../frontend-admin/pages"))
);

/* =========================
   IMPORT ROUTES
========================= */

const messageRoutes = require("./routes/messages");
const authRoutes = require("./routes/auth");
const clientRoutes = require("./routes/client");
const reservationRoutes = require("./routes/reservation");
const adminRoutes = require("./routes/admin");
const galerieRoutes = require("./routes/galerie");
const excursionRoutes = require("./routes/excursions");
const chatbotRoutes = require("./routes/chatbotRoutes");
const avisRoutes = require("./routes/avisRoutes");

// Paiement : garde ta configuration actuelle.
// Si tu as déjà un fichier routes/paiement.js fonctionnel, on pourra le réactiver après.
// const paiementRoutes = require("./routes/paiement");

/* =========================
   IMPORT CONTROLLERS
========================= */

const { getDashboardStats } = require("./controllers/adminController");
const { verifyAdminToken } = require("./controllers/authController");

/* =========================
   API ROUTES
========================= */

app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/galerie", galerieRoutes);
app.use("/api/excursions", excursionRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/avis", avisRoutes);

// Paiement désactivé temporairement pour ne pas toucher à ta partie paiement maintenant.
// app.use("/api/paiement", paiementRoutes);

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "API Ecotripswomen is running",
  });
});

/* =========================
   ADMIN DASHBOARD
========================= */

app.get("/api/admin/dashboard-stats", verifyAdminToken, getDashboardStats);

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});