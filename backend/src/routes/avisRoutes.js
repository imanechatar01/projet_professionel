const express = require("express");
const router = express.Router();

const {
  getEligibleReservations,
  createAvis,
  getMyAvis,
  getPublishedAvisByExcursion,
  getAllAvisAdmin,
  updateAvisStatus,
  deleteAvis,
} = require("../controllers/avisController");

// Middleware client : il vient de middleware/auth.js
const { verifyClientToken } = require("../middleware/auth");

// Middleware admin : il vient de controllers/authController.js
const { verifyAdminToken } = require("../controllers/authController");

/* =========================
   ROUTES CLIENT
========================= */

// Réservations confirmées/payées/terminées qui peuvent recevoir un avis
router.get(
  "/eligible-reservations",
  verifyClientToken,
  getEligibleReservations
);

// Voir mes avis
router.get(
  "/me",
  verifyClientToken,
  getMyAvis
);

// Ajouter un avis
router.post(
  "/",
  verifyClientToken,
  createAvis
);

/* =========================
   ROUTE PUBLIQUE
========================= */

// Avis publiés d’une excursion
router.get(
  "/excursion/:excursion_id",
  getPublishedAvisByExcursion
);

/* =========================
   ROUTES ADMIN
========================= */

// Voir tous les avis
router.get(
  "/admin",
  verifyAdminToken,
  getAllAvisAdmin
);

// Publier / rejeter un avis
router.patch(
  "/admin/:id/status",
  verifyAdminToken,
  updateAvisStatus
);

// Supprimer un avis
router.delete(
  "/admin/:id",
  verifyAdminToken,
  deleteAvis
);

module.exports = router;