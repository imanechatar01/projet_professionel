const Stripe = require('stripe');

// Initialiser Stripe avec la clé secrète depuis .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;