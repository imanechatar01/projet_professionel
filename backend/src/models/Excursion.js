const pool = require('../config/database');

class Excursion {
    static async findAll() {
        const result = await pool.query(
            `SELECT * FROM excursions ORDER BY created_at DESC`
        );
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query(
            `SELECT * FROM excursions WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async create(data) {
        const { titre, description, destination, prix, duree, places_max, guide, categorie, images, statut = 'active' } = data;
        const result = await pool.query(
            `INSERT INTO excursions 
             (titre, description, destination, prix, duree, places_max, guide, categorie, images, statut) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [titre, description, destination, prix, duree, places_max, guide, categorie, images, statut]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { titre, description, destination, prix, duree, places_max, guide, categorie, images, statut } = data;
        const result = await pool.query(
            `UPDATE excursions 
             SET titre = $1, description = $2, destination = $3, prix = $4, duree = $5, 
                 places_max = $6, guide = $7, categorie = $8, images = $9, statut = $10 
             WHERE id = $11 
             RETURNING *`,
            [titre, description, destination, prix, duree, places_max, guide, categorie, images, statut, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query(
            `DELETE FROM excursions WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = Excursion;