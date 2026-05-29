const pool = require('../config/database');

class Message {
    // Créer un message client
    static async create(data) {
        const { client_id, nom, email, sujet, message } = data;

        const result = await pool.query(
            `INSERT INTO messages (client_id, nom, email, sujet, message) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [client_id, nom, email, sujet, message]
        );

        return result.rows[0];
    }

    // Récupérer tous les messages admin
    static async findAll() {
        const result = await pool.query(
            `SELECT 
                m.*, 
                c.nom as client_nom
             FROM messages m
             LEFT JOIN clientes c ON m.client_id = c.id
             ORDER BY m.created_at ASC`
        );

        return result.rows;
    }

    // Récupérer les messages d'un client spécifique
    static async findByClientId(clientId) {
        const result = await pool.query(
            `SELECT * 
             FROM messages 
             WHERE client_id = $1 
             ORDER BY created_at ASC`,
            [clientId]
        );

        return result.rows;
    }

    // Récupérer les messages non lus
    static async findUnread() {
        const result = await pool.query(
            `SELECT * 
             FROM messages 
             WHERE lu = false 
             ORDER BY created_at ASC`
        );

        return result.rows;
    }

    // Marquer comme lu
    static async markAsRead(id) {
        const result = await pool.query(
            `UPDATE messages 
             SET lu = true, updated_at = NOW() 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );

        return result.rows[0];
    }

    // Répondre à un message
    static async reply(id, reponse) {
        const result = await pool.query(
            `UPDATE messages 
             SET reponse = $1, date_reponse = NOW(), updated_at = NOW() 
             WHERE id = $2 
             RETURNING *`,
            [reponse, id]
        );

        return result.rows[0];
    }

    // Compter les messages non lus
    static async countUnread() {
        const result = await pool.query(
            `SELECT COUNT(*) 
             FROM messages 
             WHERE lu = false`
        );

        return parseInt(result.rows[0].count);
    }
}

module.exports = Message;