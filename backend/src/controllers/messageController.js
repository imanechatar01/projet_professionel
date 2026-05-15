const pool = require('../config/database');  // ← AJOUTER CETTE LIGNE
const Message = require('../models/message');


// 1. Créer un message (client connecté)
const createMessage = async (req, res) => {
    const client_id = req.clientId;
    const { sujet, message } = req.body;
    
    // Récupérer les infos du client depuis la BDD
    const clientResult = await pool.query(
        'SELECT nom, email FROM clientes WHERE id = $1',
        [client_id]
    );
    const client = clientResult.rows[0];

    if (!sujet || !message) {
        return res.status(400).json({
            success: false,
            message: 'Sujet et message sont requis'
        });
    }

    try {
        const newMessage = await Message.create({
            client_id,
            nom: client.nom,
            email: client.email,
            sujet,
            message
        });

        res.status(201).json({
            success: true,
            message: 'Votre message a été envoyé avec succès',
            data: newMessage
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 2. Récupérer mes messages (client connecté)
const getMyMessages = async (req, res) => {
    const client_id = req.clientId;

    try {
        const messages = await Message.findByClientId(client_id);
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 3. Récupérer tous les messages (admin)
const getAllMessages = async (req, res) => {
    try {
        const messages = await Message.findAll();
        const unreadCount = await Message.countUnread();
        res.json({
            success: true,
            messages,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 4. Marquer comme lu (admin)
const markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const message = await Message.markAsRead(id);
        res.json({ success: true, message: 'Message marqué comme lu', data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 5. Répondre (admin)
const replyToMessage = async (req, res) => {
    const { id } = req.params;
    const { reponse } = req.body;

    if (!reponse) {
        return res.status(400).json({ success: false, message: 'La réponse est requise' });
    }

    try {
        const updated = await Message.reply(id, reponse);
        res.json({ success: true, message: 'Réponse enregistrée', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

module.exports = {
    createMessage,
    getMyMessages,
    getAllMessages,
    markAsRead,
    replyToMessage
};