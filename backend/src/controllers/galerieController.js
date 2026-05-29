const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// Ajouter une image
const addImage = async (req, res) => {
    try {
        const { titre, description, categorie } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image obligatoire"
            });
        }

        const image_url = req.file.filename;

        const createdBy =
            req.adminId ||
            req.userId ||
            req.user?.id ||
            req.admin?.id ||
            null;

        const result = await pool.query(
            `INSERT INTO galerie (titre, description, image_url, created_by, categorie)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                titre,
                description || '',
                image_url,
                createdBy,
                categorie || 'principale'
            ]
        );

        res.status(201).json({
            success: true,
            message: "Image ajoutée avec succès",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("Erreur addImage galerie :", err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Récupérer toutes les images
const getAllImages = async (req, res) => {
    try {
        let {
            page = 1,
            limit = 10,
            titre = '',
            sort = 'DESC',
            categorie = ''
        } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        const offset = (page - 1) * limit;

        const queryParams = [];
        const conditions = [];

        let queryStr = 'SELECT * FROM galerie';
        let countQueryStr = 'SELECT COUNT(*) FROM galerie';

        if (titre) {
            queryParams.push(`%${titre}%`);
            conditions.push(`titre ILIKE $${queryParams.length}`);
        }

        if (categorie && categorie !== 'toutes') {
            queryParams.push(categorie);
            conditions.push(`categorie = $${queryParams.length}`);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            queryStr += whereClause;
            countQueryStr += whereClause;
        }

        const countParams = [...queryParams];

        const order = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        queryStr += ` ORDER BY created_at ${order}`;
        queryStr += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

        queryParams.push(limit, offset);

        const [result, countResult] = await Promise.all([
            pool.query(queryStr, queryParams),
            pool.query(countQueryStr, countParams)
        ]);

        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });

    } catch (err) {
        console.error("Erreur getAllImages galerie :", err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Modifier une image
const updateImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { titre, description, categorie } = req.body;

        const oldImageResult = await pool.query(
            'SELECT * FROM galerie WHERE id = $1',
            [id]
        );

        if (oldImageResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Image introuvable"
            });
        }

        let image_url = oldImageResult.rows[0].image_url;

        if (req.file) {
            const oldFilePath = path.join(__dirname, '../../uploads', image_url);

            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }

            image_url = req.file.filename;
        }

        const result = await pool.query(
            `UPDATE galerie
             SET titre = $1,
                 description = $2,
                 categorie = $3,
                 image_url = $4,
                 updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [
                titre,
                description || '',
                categorie || 'principale',
                image_url,
                id
            ]
        );

        res.json({
            success: true,
            message: "Image modifiée avec succès",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("Erreur updateImage galerie :", err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Supprimer une image
const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;

        const imageResult = await pool.query(
            'SELECT image_url FROM galerie WHERE id = $1',
            [id]
        );

        if (imageResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Image introuvable"
            });
        }

        const fileName = imageResult.rows[0].image_url;

        if (fileName) {
            const filePath = path.join(__dirname, '../../uploads', fileName);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await pool.query('DELETE FROM galerie WHERE id = $1', [id]);

        res.json({
            success: true,
            message: "Image supprimée avec succès"
        });

    } catch (err) {
        console.error("Erreur deleteImage galerie :", err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    addImage,
    getAllImages,
    updateImage,
    deleteImage
};