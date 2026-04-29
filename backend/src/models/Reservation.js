const pool = require('../config/database');

class Reservation {
    // Générer un numéro de réservation unique
    static generateNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `RES-${year}${month}-${random}`;
    }

    // Créer une réservation
    static async createReservation(data) {
        const {
            client_id,
            excursion_id,
            nb_personnes,
            montant_total,
            demande_speciale,
            statut = 'En attente'
        } = data;

        const numero_reservation = this.generateNumber();

        const result = await pool.query(
            `INSERT INTO reservations 
             (cliente_id, excursion_id, nb_personnes, montant_total, demande_speciale, numero_reservation, statut) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [client_id, excursion_id || null, nb_personnes, montant_total, demande_speciale || null, numero_reservation, statut]
        );

        return result.rows[0];
    }

    // Récupérer les réservations d'un client
    static async findByClientId(clientId) {
        const result = await pool.query(
            `SELECT r.*, e.titre as excursion_titre, e.prix as excursion_prix, r.created_at as excursion_date, c.nom as client_nom, c.prenom as client_prenom, c.email as client_email
             FROM reservations r
             LEFT JOIN clientes c ON r.cliente_id = c.id
             LEFT JOIN excursions e ON r.excursion_id = e.id
             WHERE r.cliente_id = $1 
             ORDER BY r.created_at DESC`,
            [clientId]
        );
        return result.rows;
    }

    // Récupérer une réservation par ID
    static async findById(id) {
        const result = await pool.query(
            `SELECT r.*, e.titre as excursion_titre, e.prix as excursion_prix, r.created_at as excursion_date, c.nom as client_nom, c.email as client_email, c.prenom as client_prenom
             FROM reservations r
             LEFT JOIN clientes c ON r.cliente_id = c.id
             LEFT JOIN excursions e ON r.excursion_id = e.id
             WHERE r.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Récupérer toutes les réservations (admin)
    static async findAll() {
        const result = await pool.query(
            `SELECT r.*, e.titre as excursion_titre, e.prix as excursion_prix, r.created_at as excursion_date, c.nom as client_nom, c.email as client_email, c.prenom as client_prenom
             FROM reservations r
             LEFT JOIN clientes c ON r.cliente_id = c.id
             LEFT JOIN excursions e ON r.excursion_id = e.id
             ORDER BY r.created_at DESC`
        );
        return result.rows;
    }

    // Mettre à jour le statut
    static async updateStatus(id, statut) {
        const result = await pool.query(
            `UPDATE reservations 
             SET statut = $1 
             WHERE id = $2 
             RETURNING *`,
            [statut, id]
        );
        return result.rows[0];
    }

    // Annuler une réservation
    static async cancel(id) {
        const result = await pool.query(
            `UPDATE reservations 
             SET statut = 'annulee' 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query(
            `DELETE FROM reservations
             WHERE id = $1
             RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    // Obtenir les statistiques des réservations
    static async getStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut IN ('En attente', 'en attente', 'en_attente', 'enattente') THEN 1 ELSE 0 END) as en_attente,
                SUM(CASE WHEN statut IN ('Confirmée', 'confirmée', 'confirmee', 'Confirmé', 'confirme') THEN 1 ELSE 0 END) as confirmee,
                SUM(CASE WHEN statut IN ('Annulée', 'annulée', 'annulee', 'Annulé', 'annule') THEN 1 ELSE 0 END) as annulee,
                SUM(CASE WHEN statut IN ('Terminée', 'terminée', 'terminee', 'Terminé', 'termine') THEN 1 ELSE 0 END) as terminee,
                COALESCE(SUM(montant_total), 0) as chiffre_affaires
            FROM reservations
        `);
        return result.rows[0];
    }
}

module.exports = Reservation;