const express = require('express');
const router = express.Router();
const excursionController = require('../controllers/excursionController');

router.get('/', excursionController.getAllExcursions);
router.get('/:id', excursionController.getExcursionById);
router.post('/', excursionController.createExcursion);
router.put('/:id', excursionController.updateExcursion);
router.delete('/:id', excursionController.deleteExcursion);

module.exports = router;