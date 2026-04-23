const stripe = require('../config/stripe');
const Reservation = require('../models/reservation');
const Paiement = require('../models/paiement');

// 1. Créer une intention de paiement
const createPaymentIntent = async (req, res) => {
    const client_id = req.clientId;
    const { reservation_id } = req.body;

    if (!reservation_id) {
        return res.status(400).json({
            success: false,
            message: 'ID de réservation requis'
        });
    }

    try {
        const reservation = await Reservation.findById(reservation_id);
        
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        if (reservation.client_id !== client_id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        // Créer le PaymentIntent Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(reservation.montant_total * 100),
            currency: 'mad',
            metadata: {
                reservation_id: reservation.id,
                client_id: client_id
            },
            description: `Paiement réservation `
        });

        // Enregistrer dans la BDD
        await Paiement.create({
            reservation_id: reservation.id,
            montant: reservation.montant_total,
            client_id: client_id
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            redirectUrl: `../web_site.html?id=${reservation.id}`
        });
      
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du paiement'
        });
    }
};

// 2. Webhook Stripe (confirmation automatique)
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const reservationId = parseInt(paymentIntent.metadata.reservation_id);
        
        // Mettre à jour la réservation
        await Reservation.updateStatus(reservationId, 'confirmee');
        
        // Mettre à jour le paiement
        await Paiement.updateStatusByReservationId(reservationId, 'paye');
        
        console.log(`✅ Paiement réussi pour réservation ${reservationId}`);
    }

    res.json({ received: true });
};

// 3. Vérifier le statut d'un paiement
const checkPaymentStatus = async (req, res) => {
    const { reservation_id } = req.params;
    const client_id = req.clientId;

    try {
        const reservation = await Reservation.findById(reservation_id);
        
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        if (reservation.client_id !== client_id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const paiement = await Paiement.findByReservationId(reservation_id);

        res.json({
            success: true,
            reservation: {
                statut: reservation.statut,
                montant: reservation.montant_total
            },
            paiement: paiement ? {
                statut: paiement.statut,
                date_paiement: paiement.date_paiement
            } : null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

module.exports = {
    createPaymentIntent,
    handleWebhook,
    checkPaymentStatus
};