require('dotenv').config();
const emailService = require('./src/services/emailService');

async function test() {
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅' : '❌');
    
    emailService.initTransporter();
    
    const result = await emailService.sendEmail(
        'salmachair248@gmail.com',  // ton email pour test
        'Test Ecotrips',
        '<h1>Test réussi !</h1>'
    );
    
    console.log('Résultat:', result);
}

test();