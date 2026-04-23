const Stripe = require('stripe');

// Ta clé secrète (commence par sk_test_)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;