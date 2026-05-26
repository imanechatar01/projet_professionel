const pool = require('../config/database');
const { verifyClientToken } = require('../middleware/auth');
// Récupérer les messages du client
const getClientMessages = async (req, res) => {
    const clientId = req.clientId;
    console.log(`Récupération des messages pour client ID: ${clientId}`);
    try {
        const result = await pool.query(
            `SELECT id, message, reponse, created_at, updated_at,
                    (CASE WHEN reponse IS NOT NULL AND reponse != '' THEN true ELSE false END) as repondu
             FROM messages 
             WHERE client_id = $1 
             ORDER BY created_at `,
            [clientId]
        );
        res.json({ success: true, messages: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Envoyer un message
const sendClientMessage = async (req, res) => {
    const clientId = req.clientId;
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: "Message requis" });
    }

    try {
        // Récupérer le nom et l'email du client
        const clientInfo = await pool.query(
            `SELECT nom, prenom, email FROM clientes WHERE id = $1`,
            [clientId]
        );
console.log('Info client récupérée pour message:', clientInfo.rows[0]);
        if (clientInfo.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Client non trouvé" });
        }

        const fullName = `${clientInfo.rows[0].prenom || ''} ${clientInfo.rows[0].nom}`.trim();
        const email = clientInfo.rows[0].email;

        await pool.query(
            `INSERT INTO messages (client_id, nom, email, message) VALUES ($1, $2, $3, $4)`,
            [clientId, fullName || email, email, message]
        );

        res.json({ success: true, message: "Message envoyé" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Récupérer profil client (protégé)
const getClientProfile = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nom, prenom, email, telephone, created_at FROM clientes WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Client non trouvé' 
            });
        }

        res.json({ success: true, client: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};


module.exports = {
    getClientMessages,
    sendClientMessage,
    getClientProfile
};