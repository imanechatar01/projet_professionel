const Reservation = require('../models/reservation');

const normalizeStatus = (value) => (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const canonicalStatus = (value) => {
    const normalized = normalizeStatus(value);

    if (normalized === 'en attente' || normalized === 'enattente') return 'En attente';
    if (normalized === 'confirmee' || normalized === 'confirme') return 'Confirmée';
    if (normalized === 'annulee' || normalized === 'annule') return 'Annulée';
    if (normalized === 'terminee' || normalized === 'termine') return 'Terminée';

    // Fallback pour les correspondances exactes (utile si déjà formaté)
    const exactMatches = {
        'En attente': 'En attente',
        'Confirmée': 'Confirmée',
        'Annulée': 'Annulée',
        'Terminée': 'Terminée'
    };
    
    return exactMatches[value] || value;
};

// ============================================
// 1. CRÉER UNE RÉSERVATION (client connecté)
// ============================================
const createReservation = async (req, res) => {
    // L'ID du client vient du token (ajouté par le middleware verifyClientToken)
    const client_id = req.clientId;
    
    const {
        excursion_id,
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
            excursion_id: excursion_id || null,
            nb_personnes,
            montant_total,
            demande_speciale: demande_speciale || null,
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
                demande_speciale: reservation.demande_speciale
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

const updateReservationStatus = async (req, res) => {
    const { id } = req.params;
    const statut = canonicalStatus(req.body.statut);

    const validStatuts = ['En attente', 'Confirmée', 'Annulée', 'Terminée'];
    
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
        console.log(`Tentative de mise à jour réservation ${id} vers statut: ${statut}`);
        const reservation = await Reservation.updateStatus(id, statut);
        
        if (!reservation) {
            console.error(`Réservation ${id} non trouvée dans la base`);
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        console.log(`Mise à jour réussie pour réservation ${id}`);
        res.json({
            success: true,
            message: `Statut mis à jour : ${statut}`,
            reservation
        });

    } catch (error) {
        console.error('ERREUR CRITIQUE mise à jour statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur : ' + error.message
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