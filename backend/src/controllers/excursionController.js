const Excursion = require('../models/Excursion');

exports.getAllExcursions = async (req, res) => {
    try {
        const excursions = await Excursion.findAll();
        // Transformation pour correspondre au format attendu par le front
        const formatted = excursions.map(e => ({
            id: e.id,
            nom: e.titre,
            destination: e.destination,
            categorie: e.categorie,
            prix: e.prix,
            duree: e.duree,
            places: e.places_max,
            reservees: 0, // Idéalement, faire un COUNT sur les réservations confirmées
            guide: e.guide,
            note: 4.5, // Valeur par défaut si non gérée
            statut: e.statut || 'active',
            description: e.description,
            photos: e.images ? (Array.isArray(e.images) ? e.images : [e.images]) : []
        }));
        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération des excursions' });
    }
};

exports.getExcursionById = async (req, res) => {
    try {
        const excursion = await Excursion.findById(req.params.id);
        if (!excursion) return res.status(404).json({ message: 'Excursion non trouvée' });
        res.json(excursion);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createExcursion = async (req, res) => {
    try {
        const newEx = await Excursion.create(req.body);
        res.status(201).json(newEx);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création' });
    }
};

exports.updateExcursion = async (req, res) => {
    try {
        const updated = await Excursion.update(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la modification' });
    }
};

exports.deleteExcursion = async (req, res) => {
    try {
        await Excursion.delete(req.params.id);
        res.json({ message: 'Excursion supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};