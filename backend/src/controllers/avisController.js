const Avis = require("../models/Avis");

const getEligibleReservations = async (req, res) => {
  try {
    const clientId = req.clientId;

    const reservations = await Avis.getEligibleReservations(clientId);

    res.json({
      success: true,
      reservations
    });
  } catch (error) {
    console.error("Erreur getEligibleReservations:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des réservations éligibles"
    });
  }
};

const createAvis = async (req, res) => {
  try {
    const clientId = req.clientId;
    const { reservation_id, note, commentaire } = req.body;

    if (!reservation_id) {
      return res.status(400).json({
        success: false,
        message: "Réservation obligatoire"
      });
    }

    if (!note || note < 1 || note > 5) {
      return res.status(400).json({
        success: false,
        message: "La note doit être entre 1 et 5"
      });
    }

    if (!commentaire || commentaire.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Le commentaire doit contenir au moins 5 caractères"
      });
    }

    const avis = await Avis.create({
      client_id: clientId,
      reservation_id,
      note,
      commentaire: commentaire.trim()
    });

    res.status(201).json({
      success: true,
      message: "Avis envoyé avec succès. Il sera visible après validation.",
      avis
    });
  } catch (error) {
    console.error("Erreur createAvis:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Erreur lors de l’ajout de l’avis"
    });
  }
};

const getMyAvis = async (req, res) => {
  try {
    const clientId = req.clientId;

    const avis = await Avis.getByClient(clientId);

    res.json({
      success: true,
      avis
    });
  } catch (error) {
    console.error("Erreur getMyAvis:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des avis"
    });
  }
};

const getPublishedAvisByExcursion = async (req, res) => {
  try {
    const { excursion_id } = req.params;

    const avis = await Avis.getPublishedByExcursion(excursion_id);

    res.json({
      success: true,
      avis
    });
  } catch (error) {
    console.error("Erreur getPublishedAvisByExcursion:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des avis publics"
    });
  }
};

const getAllAvisAdmin = async (req, res) => {
  try {
    const avis = await Avis.getAllForAdmin();

    res.json({
      success: true,
      avis
    });
  } catch (error) {
    console.error("Erreur getAllAvisAdmin:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des avis admin"
    });
  }
};

const updateAvisStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const allowedStatuses = ["en_attente", "publie", "rejete"];

    if (!allowedStatuses.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide"
      });
    }

    const avis = await Avis.updateStatus(id, statut);

    res.json({
      success: true,
      message: "Statut de l’avis mis à jour",
      avis
    });
  } catch (error) {
    console.error("Erreur updateAvisStatus:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l’avis"
    });
  }
};

const deleteAvis = async (req, res) => {
  try {
    const { id } = req.params;

    await Avis.delete(id);

    res.json({
      success: true,
      message: "Avis supprimé"
    });
  } catch (error) {
    console.error("Erreur deleteAvis:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l’avis"
    });
  }
};

module.exports = {
  getEligibleReservations,
  createAvis,
  getMyAvis,
  getPublishedAvisByExcursion,
  getAllAvisAdmin,
  updateAvisStatus,
  deleteAvis
};