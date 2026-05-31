const Reservation = require('../models/reservation');
const emailService = require('../services/emailService');


emailService.initTransporter();
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
    console.log('Client ID pour la réservation:', client_id);
    console.log('Données reçues pour la création de réservation:', req.body);
    console.log('Excursion ID pour la réservation:', req.body.excursion_id);
    const {
        excursion_id ,
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
        // Valider que l'excursion existe si un ID est fourni
        let validExcursionId = null;
        if (excursion_id) {
            const pool = require('../config/database');
            const excursionCheck = await pool.query(
                'SELECT id FROM excursions WHERE id = $1',
                [excursion_id]
            );
            if (excursionCheck.rows.length > 0) {
                validExcursionId = excursion_id;
            }
            // Si l'excursion n'existe pas, on continue avec null (pas de blocage)
        }

        const reservation = await Reservation.createReservation({
            client_id,
            excursion_id: validExcursionId,
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
        console.log(`Récupération des réservations pour client ${client_id} réussie. Nombre de réservations: ${reservations.length}`);

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

    try {
        const reservation = await Reservation.updateStatus(id, statut);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        // Envoi email si nécessaire
        if (statut === 'Annulée') {

            const reservationDetails = await Reservation.findById(id);

            if (emailService.isEmailConfigured()) {
                await emailService.sendCancellationEmail(
                    reservationDetails.client_email,
                    reservationDetails.client_nom,
                    {
                        numero_reservation: reservationDetails.numero_reservation,
                        excursion_titre: reservationDetails.excursion_titre,
                        nb_personnes: reservationDetails.nb_personnes,
                        montant_total: reservationDetails.montant_total
                    }
                );
            }
        }

        if (statut === 'Confirmée') {

            const reservationDetails = await Reservation.findById(id);

            if (emailService.isEmailConfigured()) {
                await emailService.sendConfirmationEmail(
                    reservationDetails.client_email,
                    reservationDetails.client_nom,
                    {
                        numero_reservation: reservationDetails.numero_reservation,
                        excursion_titre: reservationDetails.excursion_titre,
                        nb_personnes: reservationDetails.nb_personnes,
                        montant_total: reservationDetails.montant_total
                    }
                );
            }
        }

        // UNE SEULE réponse
        return res.json({
            success: true,
            message: `Statut mis à jour : ${statut}`,
            reservation
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ============================================
// 6. ANNULER UNE RÉSERVATION (client propriétaire ou admin)
// ============================================




const cancelReservation = async (req, res) => {
    console.log("ANNULATION APPELÉE");
    const { id } = req.params;
    const client_id = req.clientId;
    const isAdmin = req.user?.role === 'admin';

    try {
        const reservation = await Reservation.findById(id);
        console.log("Client email =", reservation.client_email);
        
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

        // Mettre à jour le statut
        const updatedReservation = await Reservation.updateStatus(id, 'annulee');

        // ============================================
        // ENVOI D'EMAIL AU CLIENT
        // ============================================
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await emailService.sendCancellationEmail(
    reservation.client_email,
    reservation.client_nom,
    {
        numero_reservation: reservation.numero_reservation,
        excursion_titre: reservation.excursion_titre,
        nb_personnes: reservation.nb_personnes,
        montant_total: reservation.montant_total
    }
);

                console.log(`📧 Email d'annulation envoyé à ${reservation.client_email}`);

            } catch (emailError) {
                console.error('❌ Erreur envoi email:', emailError);
                // On continue même si l'email échoue
            }
        } else {
            console.log('⚠️ Email non configuré. Aucun email envoyé.');
        }

        res.json({
            success: true,
            message: 'Réservation annulée avec succès. Un email a été envoyé à la cliente.',
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
// Exemple : confirmation de réservation (après paiement)
const confirmReservation = async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Accès non autorisé'
        });
    }

    try {
        const reservation = await Reservation.findById(id);
        console.log("Client email =", reservation.client_email);
        
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        const updatedReservation = await Reservation.updateStatus(id, 'confirmee');

        // Envoyer un email de confirmation
        if (emailService.isEmailConfigured()) {
            console.log("Client email =", reservation.client_email);
            await emailService.sendConfirmationEmail(
                reservation.client_email,
                reservation.client_nom,
                {
                    
                    excursion_titre: reservation.excursion_titre,
                    nb_personnes: reservation.nb_personnes,
                    montant_total: reservation.montant_total
                }
            );
        }

        res.json({
            success: true,
            message: 'Réservation confirmée. Un email a été envoyé à la cliente.',
            reservation: updatedReservation
        });

    } catch (error) {
        console.error('Erreur confirmation réservation:', error);
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
    confirmReservation,  // Ajouter cette fonction
    getReservationStats
};