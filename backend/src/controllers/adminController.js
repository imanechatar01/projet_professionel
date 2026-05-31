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
            JOIN clientes c ON r.client_id = c.id
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

const updateAdminClient = async (req, res) => {
    const { id } = req.params;
    const { nom, prenom, email, telephone, password } = req.body;

    if (!nom || !email) {
        return res.status(400).json({ success: false, message: 'Nom et email requis' });
    }

    try {
        const existing = await pool.query('SELECT id FROM clientes WHERE email = $1 AND id != $2', [email, id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé par une autre cliente' });
        }

        let query = `UPDATE clientes SET nom = $1, prenom = $2, email = $3, telephone = $4`;
        const params = [nom, prenom || null, email, telephone || null];

        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            params.push(hashedPassword);
            query += `, password_hash = $${params.length}`;
        }

        params.push(id);
        query += ` WHERE id = $${params.length} RETURNING id, nom, prenom, email, telephone, created_at`;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente non trouvée' });
        }

        res.json({ success: true, client: result.rows[0] });
    } catch (error) {
        console.error('Erreur mis a jour client admin:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const deleteAdminClient = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente non trouvée' });
        }

        res.json({ success: true, message: 'Cliente supprimée' });
    } catch (error) {
        console.error('Erreur suppression client admin:', error);
        //une erreur 23503 si elle a des réservations
        if (error.code === '23503') {
            return res.status(400).json({ success: false, message: 'Impossible de supprimer cette cliente car elle a des réservations associées.' });
        }
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

const createAdminExcursion = async (req, res) => {
    try {
        const { titre, description, destination, prix, duree, ville_depart, lieu, type, image_url, programme, date_debut, date_fin, places_total } = req.body;
        
        if (!titre || !prix) {
            return res.status(400).json({ success: false, message: 'Le titre et le prix sont obligatoires' });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : (image_url || null);
        
        const result = await pool.query(
            `INSERT INTO excursions (titre, description, destination, prix, duree, lieu, type, image_url, programme, date_debut, date_fin, places_total, places_restantes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
                titre,
                description,
                destination || '', 
                prix,
                duree || req.body["durée"] || '',
                lieu || ville_depart || '', // Map ville_depart from form to 'lieu' column
                type || 'autre',
                imageUrl,
                programme || '',
                date_debut || null,
                date_fin || null,
                places_total || 0,
                places_total || 0
            ]
        );
        res.status(201).json({ success: true, excursion: result.rows[0] });
    } catch (error) {
        console.error('Erreur création excursion:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création du voyage : ' + error.message });
    }
};

const updateAdminExcursion = async (req, res) => {
    const { id } = req.params;
    try {
        let imageUrl = req.body.image_url;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const { titre, description, destination, prix, duree, ville_depart, lieu, type, programme, date_debut, date_fin, places_total } = req.body;
        const finalDuree = duree || req.body["durée"];

        const result = await pool.query(
            `UPDATE excursions 
             SET titre = $1, description = $2, destination = $3, prix = $4, duree = $5, lieu = $6, type = $7, image_url = $8, programme = $9, date_debut = $10, date_fin = $11, places_total = $12
             WHERE id = $13
             RETURNING *`,
            [
                titre,
                description,
                destination || '',
                prix,
                finalDuree || '',
                lieu || ville_depart || '', // Map ville_depart from form to 'lieu' column
                type || 'autre',
                imageUrl,
                programme || '',
                date_debut || null,
                date_fin || null,
                places_total || 0,
                id
            ]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Voyage non trouvé' });
        }
        res.json({ success: true, excursion: result.rows[0] });
    } catch (error) {
        console.error('Erreur mise à jour excursion détaillée:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
    }
};

const deleteAdminExcursion = async (req, res) => {
    const { id } = req.params;
    try {
        // Vérifier si des réservations existent pour cette excursion
        const check = await pool.query('SELECT count(*) FROM reservations WHERE excursion_id = $1', [id]);
        if (parseInt(check.rows[0].count) > 0) {
            return res.status(400).json({ 
                success: false,
                hasReservations: true,
                message: 'Impossible de supprimer ce voyage car il possède des réservations actives.' 
            });
        }

        const result = await pool.query('DELETE FROM excursions WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Voyage non trouvé' });
        }
        res.json({ success: true, message: 'Voyage supprimé' });
    } catch (error) {
        console.error('Erreur suppression excursion:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression' });
    }
};

const deleteAdminExcursionRecursive = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    
    let dbClient;
    try {
        dbClient = await pool.connect();
        await dbClient.query('BEGIN');

        // 1. Récupérer les emails des clients concernés
        const clientsResult = await dbClient.query(`
            SELECT DISTINCT c.email, c.nom, c.prenom 
            FROM clientes c
            JOIN reservations r ON c.id = r.client_id
            WHERE r.excursion_id = $1
        `, [id]);

        // 2. Simuler l'envoi d'email (Journalisation)
        console.log(`--- SIMULATION ENVOI EMAILS (Annulation Excursion ID: ${id}) ---`);
        clientsResult.rows.forEach(c => {
            console.log(`À: ${c.email} | Message: ${message}`);
        });
        console.log('--- FIN SIMULATION ---');

        // 3. Supprimer les réservations (récursif)
        await dbClient.query('DELETE FROM reservations WHERE excursion_id = $1', [id]);

        // 4. Supprimer l'excursion
        const result = await dbClient.query('DELETE FROM excursions WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            throw new Error('Excursion non trouvée');
        }

        await dbClient.query('COMMIT');
        res.json({ success: true, message: 'Emails envoyés et voyage supprimé récursivement' });
    } catch (error) {
        if (dbClient) await dbClient.query('ROLLBACK');
        console.error('Erreur suppression récursive:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (dbClient) dbClient.release();
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
            statut: 'Confirmée' //statut confirmé car chaque reservation crée par l'admin doit etre automatiquement confirmée
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
module.exports.updateAdminClient = updateAdminClient;
module.exports.deleteAdminClient = deleteAdminClient;
module.exports.getAdminExcursions = getAdminExcursions;
module.exports.createAdminExcursion = createAdminExcursion;
module.exports.updateAdminExcursion = updateAdminExcursion;
module.exports.deleteAdminExcursion = deleteAdminExcursion;
module.exports.deleteAdminExcursionRecursive = deleteAdminExcursionRecursive;
module.exports.createAdminReservation = createAdminReservation;
module.exports.deleteAdminReservation = deleteAdminReservation;
