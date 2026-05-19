const pool = require("../config/database");

class Avis {
  static async getEligibleReservations(clientId) {
    const result = await pool.query(
      `
      SELECT 
        r.id AS reservation_id,
        r.client_id,
        r.excursion_id,
        r.nb_personnes,
        r.montant_total,
        r.statut,
        r.created_at,
        e.titre AS excursion_titre,
        e.image_url
      FROM reservations r
      JOIN excursions e ON e.id = r.excursion_id
      WHERE r.client_id = $1
      AND (
        LOWER(COALESCE(r.statut, '')) LIKE '%confirm%'
        OR LOWER(COALESCE(r.statut, '')) LIKE '%pay%'
        OR LOWER(COALESCE(r.statut, '')) LIKE '%valid%'
        OR LOWER(COALESCE(r.statut, '')) LIKE '%termin%'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM avis a
        WHERE a.reservation_id = r.id
        AND a.client_id = r.client_id
      )
      ORDER BY r.created_at DESC
      `,
      [clientId]
    );

    return result.rows;
  }

  static async create(data) {
    const { client_id, reservation_id, note, commentaire } = data;

    const reservationResult = await pool.query(
      `
      SELECT *
      FROM reservations
      WHERE id = $1
      AND client_id = $2
      `,
      [reservation_id, client_id]
    );

    if (reservationResult.rows.length === 0) {
      throw new Error("Réservation introuvable pour cette cliente.");
    }

    const reservation = reservationResult.rows[0];
    const statut = String(reservation.statut || "").toLowerCase();

    const allowed =
      statut.includes("confirm") ||
      statut.includes("pay") ||
      statut.includes("valid") ||
      statut.includes("termin");

    if (!allowed) {
      throw new Error("Tu pourras laisser un avis après confirmation ou participation au voyage.");
    }

    const result = await pool.query(
      `
      INSERT INTO avis
      (client_id, excursion_id, reservation_id, note, commentaire, statut)
      VALUES ($1, $2, $3, $4, $5, 'en_attente')
      RETURNING *
      `,
      [
        client_id,
        reservation.excursion_id,
        reservation_id,
        note,
        commentaire
      ]
    );

    return result.rows[0];
  }

  static async getByClient(clientId) {
    const result = await pool.query(
      `
      SELECT 
        a.*,
        e.titre AS excursion_titre,
        e.image_url
      FROM avis a
      JOIN excursions e ON e.id = a.excursion_id
      WHERE a.client_id = $1
      ORDER BY a.created_at DESC
      `,
      [clientId]
    );

    return result.rows;
  }

  static async getPublishedByExcursion(excursionId) {
    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.note,
        a.commentaire,
        a.created_at,
        c.nom,
        c.prenom
      FROM avis a
      JOIN clientes c ON c.id = a.client_id
      WHERE a.excursion_id = $1
      AND a.statut = 'publie'
      ORDER BY a.created_at DESC
      `,
      [excursionId]
    );

    return result.rows;
  }

  static async getAllForAdmin() {
    const result = await pool.query(
      `
      SELECT 
        a.*,
        c.nom AS client_nom,
        c.prenom AS client_prenom,
        c.email AS client_email,
        e.titre AS excursion_titre
      FROM avis a
      JOIN clientes c ON c.id = a.client_id
      JOIN excursions e ON e.id = a.excursion_id
      ORDER BY a.created_at DESC
      `
    );

    return result.rows;
  }

  static async updateStatus(id, statut) {
    const result = await pool.query(
      `
      UPDATE avis
      SET statut = $1,
          updated_at = now()
      WHERE id = $2
      RETURNING *
      `,
      [statut, id]
    );

    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      `
      DELETE FROM avis
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return result.rows[0];
  }
}

module.exports = Avis;