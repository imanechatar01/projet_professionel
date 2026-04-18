const pool = require('../config/database');

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
            "SELECT COALESCE(SUM(montant_total), 0) as total FROM reservations WHERE statut = 'Confirmée'"
        ).catch(e => ({ rows: [{ total: 0 }] }));

        const activeReservations = await pool.query(
            "SELECT COUNT(*) FROM reservations WHERE statut != 'Annulée'"
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
