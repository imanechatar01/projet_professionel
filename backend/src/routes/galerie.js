const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { verifyAdminToken } = require('../controllers/authController');

const {
    addImage,
    getAllImages,
    updateImage,
    deleteImage
} = require('../controllers/galerieController');

// Afficher toutes les images : public
router.get('/', getAllImages);

// Ajouter une image : admin seulement
router.post('/add', verifyAdminToken, upload.single('image'), addImage);

// Modifier une image : admin seulement
router.put('/:id', verifyAdminToken, upload.single('image'), updateImage);

// Supprimer une image : admin seulement
router.delete('/:id', verifyAdminToken, deleteImage);

module.exports = router;