const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { plano } = JSON.parse(event.body);

  const priceLookup = {
    basico: 'price_1RGrG5CaTJrTX5TuntwZRSX6',
    profissional: 'price_1RGrGnCaTJrTX5TuPBTU3gR3',
    premium: 'price_1RGrHCCaTJrTX5TuFX7GRVjv',
  };

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price: priceLookup[plano],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'https://corretorcerto.netlify.app/sucesso.html',
      cancel_url: 'https://corretorcerto.netlify.app/planos.html',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
