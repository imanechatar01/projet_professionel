const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const Reservation = require('../models/reservation');

exports.getDashboardStats = async (req, res) => {
    try {
        const { periodStatus, periodType, periodPopular, evolutionYear } = req.query;

        
        const getFilterClause = (period) => {
            if (!period || period === 'all') return "TRUE";
            if (period === '30') return "created_at >= NOW() - INTERVAL '30 days'";
            if (period === '90') return "created_at >= NOW() - INTERVAL '90 days'";
            if (period === '180') return "created_at >= NOW() - INTERVAL '6 months'";
            if (period === 'year') return "created_at >= DATE_TRUNC('year', NOW())";
            return "TRUE";
        };

        // Static KPIs
        const revenueResult = await pool.query(
            "SELECT COALESCE(SUM(montant_total), 0) as total FROM reservations WHERE statut IN ('Confirmée', 'confirmee', 'confirme', 'Confirmé', 'confirmée')"
        ).catch(e => ({ rows: [{ total: 0 }] }));

        const activeReservations = await pool.query(
            "SELECT COUNT(*) FROM reservations WHERE statut NOT IN ('Annulée', 'annulee', 'annule', 'Annulee', 'annulée')"
        ).catch(e => ({ rows: [{ count: 0 }] }));

        const newClients = await pool.query(
            "SELECT COUNT(*) FROM clientes"
        ).catch(e => ({ rows: [{ count: 0 }] }));

        const avgRating = 4.9;

        
        let evolutionQuery = "";
        let evolutionParams = [];
        
        if (!evolutionYear || evolutionYear === 'all') {
            evolutionQuery = `
                SELECT TO_CHAR(created_at, 'YYYY') as year, TO_CHAR(created_at, 'MM') as month_num, COUNT(*) as count 
                FROM reservations 
                WHERE EXTRACT(YEAR FROM created_at) BETWEEN 2023 AND 2026
                GROUP BY year, month_num
                ORDER BY year, month_num ASC
            `;
        } else {
            evolutionQuery = `
                SELECT TO_CHAR(created_at, 'YYYY') as year, TO_CHAR(created_at, 'MM') as month_num, COUNT(*) as count 
                FROM reservations 
                WHERE EXTRACT(YEAR FROM created_at) = $1
                GROUP BY year, month_num
                ORDER BY month_num ASC
            `;
            evolutionParams = [evolutionYear];
        }
        
        const evolution = await pool.query(evolutionQuery, evolutionParams).catch(e => ({ rows: [] }));

        
        const statusDistribution = await pool.query(`
            SELECT statut, COUNT(*) as count 
            FROM reservations 
            WHERE ${getFilterClause(periodStatus)}
            GROUP BY statut
        `).catch(e => ({ rows: [] }));

        // les excursions les plus populaires (Filtered)
        const popularExcursions = await pool.query(`
            SELECT e.titre, COUNT(r.id) as count 
            FROM excursions e 
            LEFT JOIN reservations r ON e.id = r.excursion_id 
            WHERE ${getFilterClause(periodPopular).replace('created_at', 'r.created_at')}
            GROUP BY e.id, e.titre 
            ORDER BY count DESC LIMIT 5
        `).catch(e => ({ rows: [] }));

        // Categories des excursions
        const categoryQuery = `
            SELECT 
                CASE 
                    WHEN LOWER(TRIM(e.type)) LIKE '%désert%' OR LOWER(TRIM(e.type)) LIKE '%desert%' THEN 'Désert'
                    WHEN LOWER(TRIM(e.type)) LIKE '%montagne%' THEN 'Montagne'
                    WHEN LOWER(TRIM(e.type)) LIKE '%culture%' THEN 'Culturel'
                    WHEN LOWER(TRIM(e.type)) LIKE '%détente%' OR LOWER(TRIM(e.type)) LIKE '%detente%' THEN 'Détente'
                    WHEN LOWER(TRIM(e.type)) LIKE '%aventure%' THEN 'Aventure'
                    WHEN LOWER(TRIM(e.type)) LIKE '%nature%' THEN 'Nature'
                    ELSE INITCAP(LOWER(TRIM(e.type)))
                END as categorie, 
                COUNT(r.id) as count 
            FROM excursions e
            LEFT JOIN reservations r ON e.id = r.excursion_id
            AND ${getFilterClause(periodType).replace('created_at', 'r.created_at')}
            GROUP BY categorie
        `;
        const categoryDistribution = await pool.query(categoryQuery).catch(e => ({ rows: [] }));

        // la listes des reservations recentes
        const recentReservations = await pool.query(`
            SELECT r.id, c.nom as cliente_nom, c.prenom as cliente_prenom, e.titre as excursion_titre, 
            r.created_at, e.prix, r.statut FROM reservations r
            JOIN clientes c ON r.cliente_id = c.id
            JOIN excursions e ON r.excursion_id = e.id
            ORDER BY r.created_at DESC LIMIT 5
        `).catch(e => ({ rows: [] }));

        res.json({
            success: true,
            stats: {
                kpi: {
                    revenue: revenueResult.rows[0].total,
                    active: activeReservations.rows[0].count,
                    newClients: newClients.rows[0].count,
                    rating: avgRating
                },
                evolution: evolution.rows,
                statusDistribution: statusDistribution.rows,
                popular: popularExcursions.rows,
                categories: categoryDistribution.rows,
                recent: recentReservations.rows
            }
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAdminClients = async (req, res) => {
    const query = (req.query.query || '').trim();
    const params = [];
    let sql = `
        SELECT id, nom, prenom, email, telephone, created_at
        FROM clientes
    `;

    if (query) {
        params.push(`%${query}%`);
        sql += ` WHERE nom ILIKE $1 OR prenom ILIKE $1 OR email ILIKE $1 OR telephone ILIKE $1`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 20`;

    try {
        const result = await pool.query(sql, params);
        res.json({ success: true, clients: result.rows });
    } catch (error) {
        console.error('Erreur récupération clients admin:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const createAdminClient = async (req, res) => {
    const { nom, prenom, email, telephone, password } = req.body;

    if (!nom || !email) {
        return res.status(400).json({ success: false, message: 'Nom et email requis' });
    }

    try {
        const existing = await pool.query('SELECT id FROM clientes WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
        }

        const temporaryPassword = password || crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        const result = await pool.query(
            `INSERT INTO clientes (nom, prenom, email, telephone, password_hash)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nom, prenom, email, telephone, created_at`,
            [nom, prenom || null, email, telephone || null, hashedPassword]
        );

        res.status(201).json({
            success: true,
            client: result.rows[0],
            temporaryPassword: password ? null : temporaryPassword
        });
    } catch (error) {
        console.error('Erreur création client admin:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const getAdminExcursions = async (req, res) => {
    const query = (req.query.query || '').trim();
    const params = [];
    let sql = `SELECT * FROM excursions`;

    if (query) {
        params.push(`%${query}%`);
        sql += ` WHERE titre ILIKE $1`;
    }

    sql += ` ORDER BY id DESC LIMIT 50`;

    try {
        const result = await pool.query(sql, params);
        res.json({ success: true, excursions: result.rows });
    } catch (error) {
        console.error('Erreur récupération excursions admin:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const createAdminReservation = async (req, res) => {
    const { client_id, excursion_id, nb_personnes, montant_total, demande_speciale } = req.body;

    if (!client_id || !excursion_id || !nb_personnes || !montant_total) {
        return res.status(400).json({
            success: false,
            message: 'client_id, excursion_id, nb_personnes et montant_total sont requis'
        });
    }

    try {
        const reservation = await Reservation.createReservation({
            client_id,
            excursion_id,
            nb_personnes,
            montant_total,
            demande_speciale: demande_speciale || null,
            statut: 'Confirmée' // Forcer le statut à Confirmée pour les créations admin
        });

        res.status(201).json({ success: true, reservation });
    } catch (error) {
        console.error('Erreur création réservation admin:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const deleteAdminReservation = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await Reservation.delete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Réservation non trouvée' });
        }

        res.json({ success: true, message: 'Réservation supprimée' });
    } catch (error) {
        console.error('Erreur suppression réservation admin:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

module.exports.getAdminClients = getAdminClients;
module.exports.createAdminClient = createAdminClient;
module.exports.getAdminExcursions = getAdminExcursions;
module.exports.createAdminReservation = createAdminReservation;
module.exports.deleteAdminReservation = deleteAdminReservation;
