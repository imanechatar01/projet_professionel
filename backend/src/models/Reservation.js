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
            nb_personnes,
            montant_total,
            demande_speciale
        } = data;

       

        const result = await pool.query(
            `INSERT INTO reservations 
             ( client_id, nb_personnes, montant_total, demande_speciale) 
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [ client_id, nb_personnes, montant_total, demande_speciale || null]
        );

        return result.rows[0];
    }

    // Récupérer les réservations d'un client
    static async findByClientId(clientId) {
        const result = await pool.query(
            `SELECT * FROM reservations 
             WHERE client_id = $1 
             ORDER BY created_at DESC`,
            [clientId]
        );
        return result.rows;
    }

    // Récupérer une réservation par ID
    static async findById(id) {
        const result = await pool.query(
            `SELECT r.*, c.nom as client_nom, c.email as client_email
             FROM reservations r
             JOIN clientes c ON r.client_id = c.id
             WHERE r.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Récupérer toutes les réservations (admin)
    static async findAll() {
        const result = await pool.query(
            `SELECT r.*, c.nom as client_nom, c.email as client_email
             FROM reservations r
             JOIN clientes c ON r.client_id = c.id
             ORDER BY r.created_at DESC`
        );
        return result.rows;
    }

    // Mettre à jour le statut
    static async updateStatus(id, statut) {
        const result = await pool.query(
            `UPDATE reservations 
             SET statut = $1, updated_at = NOW() 
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
             SET statut = 'annulee', updated_at = NOW() 
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
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
                SUM(CASE WHEN statut = 'confirmee' THEN 1 ELSE 0 END) as confirmee,
                SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) as annulee,
                SUM(CASE WHEN statut = 'terminee' THEN 1 ELSE 0 END) as terminee,
                COALESCE(SUM(montant_total), 0) as chiffre_affaires
            FROM reservations
        `);
        return result.rows[0];
    }
}

module.exports = Reservation;