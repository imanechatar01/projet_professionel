const Reservation = require('../models/reservation');

// ============================================
// 1. CRÉER UNE RÉSERVATION (client connecté)
// ============================================
const createReservation = async (req, res) => {
    // L'ID du client vient du token (ajouté par le middleware verifyClientToken)
    const client_id = req.clientId;
    
    const {
        nb_personnes,
        montant_total,
        demande_speciale,
       // excursion_id
    } = req.body;

    // Validation des champs obligatoires
    if (!nb_personnes) {
        return res.status(400).json({
            success: false,
            message: 'Le nombre de personnes est requis'
        });
    }

    if (!montant_total) {
        return res.status(400).json({
            success: false,
            message: 'Le montant total est requis'
        });
    }

    // Validation nombre de personnes
    if (nb_personnes < 1) {
        return res.status(400).json({
            success: false,
            message: 'Le nombre de personnes doit être au moins 1'
        });
    }

    // Validation montant
    if (montant_total <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Le montant total doit être supérieur à 0'
        });
    }

    try {
        const reservation = await Reservation.createReservation({
            client_id,
            nb_personnes,
            montant_total,
            demande_speciale: demande_speciale || null,
            //excursion_id: excursion_id || null
        });

        res.status(201).json({
            success: true,
            message: 'Réservation effectuée avec succès',
            reservation: {
                id: reservation.id,
               
                date: reservation.date_reservation,
                statut: reservation.statut,
                nb_personnes: reservation.nb_personnes,
                montant_total: reservation.montant_total,
                demande_speciale: reservation.demande_speciale,
                 redirectUrl: `paiement.html?id=${reservation.id}`
            }
            
        });

    } catch (error) {
        console.error('Erreur création réservation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la réservation'
        });
    }
};

// ============================================
// 2. RÉCUPÉRER MES RÉSERVATIONS (client connecté)
// ============================================
const getMyReservations = async (req, res) => {
    const client_id = req.clientId;

    try {
        const reservations = await Reservation.findByClientId(client_id);
        
        res.json({
            success: true,
            reservations: reservations,
            count: reservations.length
        });

    } catch (error) {
        console.error('Erreur récupération réservations client:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// ============================================
// 3. RÉCUPÉRER UNE RÉSERVATION PAR ID (admin ou client propriétaire)
// ============================================
const getReservationById = async (req, res) => {
    const { id } = req.params;
    const client_id = req.clientId;
    const isAdmin = req.user?.role === 'admin';

    try {
        const reservation = await Reservation.findById(id);
        
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        // Vérifier si le client est le propriétaire ou si c'est un admin
        if (!isAdmin && reservation.client_id !== client_id) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à voir cette réservation'
            });
        }

        res.json({
            success: true,
            reservation
        });

    } catch (error) {
        console.error('Erreur récupération réservation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// ============================================
// 4. RÉCUPÉRER TOUTES LES RÉSERVATIONS (admin uniquement)
// ============================================
const getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.findAll();
        
        res.json({
            success: true,
            reservations: reservations,
            count: reservations.length
        });

    } catch (error) {
        console.error('Erreur récupération toutes les réservations:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// ============================================
// 5. METTRE À JOUR LE STATUT D'UNE RÉSERVATION (admin uniquement)
// ============================================
const updateReservationStatus = async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body;

    const validStatuts = ['en_attente', 'confirmee', 'annulee', 'terminee'];
    
    if (!statut) {
        return res.status(400).json({
            success: false,
            message: 'Le statut est requis'
        });
    }

    if (!validStatuts.includes(statut)) {
        return res.status(400).json({
            success: false,
            message: `Statut invalide. Valeurs acceptées : ${validStatuts.join(', ')}`
        });
    }

    try {
        const reservation = await Reservation.updateStatus(id, statut);
        
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        res.json({
            success: true,
            message: `Statut mis à jour : ${statut}`,
            reservation
        });

    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// ============================================
// 6. ANNULER UNE RÉSERVATION (client propriétaire ou admin)
// ============================================
const cancelReservation = async (req, res) => {
    const { id } = req.params;
    const client_id = req.clientId;
    const isAdmin = req.user?.role === 'admin';

    try {
        const reservation = await Reservation.findById(id);
        
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        // Vérifier si le client est le propriétaire ou si c'est un admin
        if (!isAdmin && reservation.client_id !== client_id) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à annuler cette réservation'
            });
        }

        // Vérifier si la réservation peut être annulée
        if (reservation.statut === 'terminee') {
            return res.status(400).json({
                success: false,
                message: 'Les réservations terminées ne peuvent pas être annulées'
            });
        }

        if (reservation.statut === 'annulee') {
            return res.status(400).json({
                success: false,
                message: 'Cette réservation est déjà annulée'
            });
        }

        const updatedReservation = await Reservation.updateStatus(id, 'annulee');

        res.json({
            success: true,
            message: 'Réservation annulée avec succès',
            reservation: updatedReservation
        });

    } catch (error) {
        console.error('Erreur annulation réservation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// ============================================
// 7. STATISTIQUES DES RÉSERVATIONS (admin uniquement)
// ============================================
const getReservationStats = async (req, res) => {
    try {
        const stats = await Reservation.getStats();
        
        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// ============================================
// EXPORT DES MODULES
// ============================================
module.exports = {
    createReservation,
    getMyReservations,
    getReservationById,
    getAllReservations,
    updateReservationStatus,
    cancelReservation,
    getReservationStats
};