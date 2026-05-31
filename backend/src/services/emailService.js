const nodemailer = require('nodemailer');

// Configuration du transporteur
let transporter = null;

function initTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️ Email non configuré. Les emails ne seront pas envoyés.');
        return null;
    }
    else {
        console.log('✅ Email configuré. Les emails seront envoyés.');
        
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    return transporter;
}

// Vérifier si l'email est configuré
function isEmailConfigured() {
    console.log(process.env.EMAIL_USER);
console.log(process.env.EMAIL_PASS);
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

// Envoyer un email générique
async function sendEmail(to, subject, htmlContent) {
    if (!isEmailConfigured()) {
        console.log('⚠️ Email non configuré - Envoi ignoré');
        return { success: false, message: 'Email non configuré' };
    }

    if (!transporter) {
        initTransporter();
    }

    try {
        const info = await transporter.sendMail({
            from: `"Ecotrips Women" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        });

        console.log(`✅ Email envoyé à ${to} - ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Erreur envoi email:', error.message);
        return { success: false, error: error.message };
    }
}

// Email d'annulation de réservation
async function sendCancellationEmail(clientEmail, clientName, reservationDetails) {
    const subject = `❌ Annulation de votre réservation - Ecotrips Women`;
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0e0e8; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #c2185b; margin: 0;">Ecotrips Women</h1>
                <p style="color: #888;">Voyages 100% féminins au Maroc</p>
            </div>

            <h2 style="color: #333;">Annulation de réservation</h2>

            <p>Bonjour <strong>${clientName || 'Cliente'}</strong>,</p>

            <p>Nous vous informons que votre réservation a été <strong style="color: #c2185b;">annulée</strong>.</p>

            <div style="background: #fdf6f8; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #c2185b;">Détails de la réservation annulée</h3>
             
                <p><strong>🏔️ Excursion :</strong> ${reservationDetails.excursion_titre || 'Non spécifié'}</p>
                <p><strong>👥 Personnes :</strong> ${reservationDetails.nb_personnes || 1}</p>
                <p><strong>💰 Montant total :</strong> ${reservationDetails.montant_total || 0} MAD</p>
            </div>

            <p>Si vous avez des questions ou souhaitez modifier votre réservation, n'hésitez pas à nous contacter :</p>

            <div style="margin: 20px 0;">
                <a href="https://wa.me/212600368626" style="background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; margin-right: 10px; display: inline-block;">📱 WhatsApp</a>
                <a href="mailto:salmachair248@gmail.com" style="background: #c2185b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">✉️ Email</a>
            </div>

            <hr style="border-color: #f0e0e8; margin: 20px 0;">

            <p style="color: #888; font-size: 12px; text-align: center;">
                Ecotrips Women — Voyages 100% féminins au Maroc<br>
                <a href="https://www.instagram.com/ecotrips_women/" style="color: #c2185b;">@ecotrips_women</a>
            </p>
        </div>
    `;

    return await sendEmail(clientEmail, subject, htmlContent);
}

// Email de confirmation de réservation
async function sendConfirmationEmail(clientEmail, clientName, reservationDetails) {
    const subject = `✅ Confirmation de votre réservation - Ecotrips Women`;
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0e0e8; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #c2185b; margin: 0;">Ecotrips Women</h1>
                <p style="color: #888;">Voyages 100% féminins au Maroc</p>
            </div>

            <h2 style="color: #333;">Réservation confirmée !</h2>

            <p>Bonjour <strong>${clientName || 'Cliente'}</strong>,</p>

            <p>Nous sommes ravis de vous confirmer votre réservation.</p>

            <div style="background: #fdf6f8; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #c2185b;">Détails de votre réservation</h3>
               
                <p><strong>🏔️ Excursion :</strong> ${reservationDetails.excursion_titre || 'Non spécifié'}</p>
                <p><strong>👥 Personnes :</strong> ${reservationDetails.nb_personnes || 1}</p>
                <p><strong>💰 Montant total :</strong> ${reservationDetails.montant_total || 0} MAD</p>
            </div>

            <p>Nous avons hâte de vous accueillir pour cette aventure !</p>

            <div style="margin: 20px 0;">
                <a href="https://wa.me/212600368626" style="background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; margin-right: 10px; display: inline-block;">📱 WhatsApp</a>
                <a href="https://www.instagram.com/ecotrips_women/" style="background: #c2185b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">📷 Instagram</a>
            </div>

            <hr style="border-color: #f0e0e8; margin: 20px 0;">

            <p style="color: #888; font-size: 12px; text-align: center;">
                Ecotrips Women — Voyages 100% féminins au Maroc
            </p>
        </div>
    `;

    return await sendEmail(clientEmail, subject, htmlContent);
}

module.exports = {
    initTransporter,
    isEmailConfigured,
    sendEmail,
    sendCancellationEmail,
    sendConfirmationEmail
};