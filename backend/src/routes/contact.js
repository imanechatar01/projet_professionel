const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configuration du transporteur email (utilise un service comme Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // ton email
        pass: process.env.EMAIL_PASS  // mot de passe application
    }
});

router.post('/send', async (req, res) => {
    const { nom, email, message } = req.body;

    if (!nom || !email || !message) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }

    try {
        await transporter.sendMail({
            from: `"${nom}" <${email}>`,
            to: process.env.EMAIL_USER,
            subject: `Nouveau message de ${nom} - Ecotrips Women`,
            html: `
                <h2>Nouveau message depuis le site</h2>
                <p><strong>Nom :</strong> ${nom}</p>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Message :</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        });

        res.json({ success: true, message: 'Email envoyé avec succès' });
    } catch (error) {
        console.error('Erreur envoi email:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi' });
    }
});

module.exports = router;