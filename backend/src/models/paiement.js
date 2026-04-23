const pool = require('../config/database');

class Paiement {
    // Créer un paiement
    static async create(data) {
        const {
            reservation_id,
            montant,
            client_id
        } = data;

        const result = await pool.query(
            `INSERT INTO paiements 
             (reservation_id, montant, client_id, statut) 
             VALUES ($1, $2, $3, 'en_attente')
             RETURNING *`,
            [reservation_id, montant, client_id]
        );

        return result.rows[0];
    }

    // Mettre à jour le statut par reservation_id
    static async updateStatusByReservationId(reservationId, statut) {
        const result = await pool.query(
            `UPDATE paiements 
             SET statut = $1, date_paiement = NOW(), updated_at = NOW()
             WHERE reservation_id = $2 
             RETURNING *`,
            [statut, reservationId]
        );
        return result.rows[0];
    }

    // Récupérer un paiement par reservation_id
    static async findByReservationId(reservationId) {
        const result = await pool.query(
            'SELECT * FROM paiements WHERE reservation_id = $1',
            [reservationId]
        );
        return result.rows[0];
    }
}

module.exports = Paiement;