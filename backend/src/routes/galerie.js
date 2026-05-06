const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const upload = require('../middleware/upload');
const { verifyClientToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Upload image (ADMIN - on réutilise verifyClientToken en attendant un verifyAdminToken)
router.post('/add', verifyClientToken, upload.single('image'), async (req, res) => {
    try {
        const { titre, description, categorie } = req.body;
        const image_url = req.file.filename;

        const result = await pool.query(
            `INSERT INTO galerie (titre, description, image_url, created_by, categorie)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [titre, description, image_url, req.clientId, categorie || 'principale']
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all images (public)
router.get('/', async (req, res) => {
    try {
        let { page = 1, limit = 10, titre = '', sort = 'DESC', categorie = '' } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let queryParams = [];
        let conditions = [];

        let queryStr = 'SELECT * FROM galerie';
        let countQueryStr = 'SELECT COUNT(*) FROM galerie';

        if (titre) {
            conditions.push(`titre ILIKE $${queryParams.length + 1}`);
            queryParams.push(`%${titre}%`);
        }

        if (categorie && categorie !== 'toutes') {
            conditions.push(`categorie = $${queryParams.length + 1}`);
            queryParams.push(categorie);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            queryStr += whereClause;
            countQueryStr += whereClause;
        }

        const order = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        queryStr += ` ORDER BY created_at ${order}`;
        queryStr += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const [result, countResult] = await Promise.all([
            pool.query(queryStr, queryParams),
            pool.query(countQueryStr, queryParams.slice(0, conditions.length))
        ]);

        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            success: true,
            data: result.rows,
            pagination: { totalItems, totalPages, currentPage: page, limit }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete image (ADMIN)
router.delete('/:id', verifyClientToken, async (req, res) => {
    try {
        const { id } = req.params;

        const imageResult = await pool.query('SELECT image_url FROM galerie WHERE id=$1', [id]);
        
        if (imageResult.rows.length > 0) {
            const fileName = imageResult.rows[0].image_url;
            if (fileName) {
                const filePath = path.join(__dirname, '../../uploads', fileName);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        }

        await pool.query('DELETE FROM galerie WHERE id=$1', [id]);
        res.json({ message: "Image supprimée avec succès" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;