const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { verifyClientToken } = require('../middleware/auth');

const {
    addImage,
    getAllImages,
    updateImage,
    deleteImage
} = require('../controllers/galerieController');

// Ajouter une image
router.post('/add', verifyClientToken, upload.single('image'), addImage);

// Afficher toutes les images
router.get('/', getAllImages);

// Modifier une image
router.put('/:id', verifyClientToken, upload.single('image'), updateImage);

// Supprimer une image
router.delete('/:id', verifyClientToken, deleteImage);

module.exports = router;