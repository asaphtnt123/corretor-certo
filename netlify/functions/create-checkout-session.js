const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  console.log("📩 Requisição recebida:", event.body);

  try {
    const { plano } = JSON.parse(event.body);

    const priceLookup = {
      basico: 'price_1RHBEVCaTJrTX5TuzYgQDOyM',        // Substitua pelos seus Price IDs reais
      profissional: 'price_1RGrGnCaTJrTX5TuPBTU3gR3',
      premium: 'price_1RGrHCCaTJrTX5TuFX7GRVjv'
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Apenas 'card' agora
      line_items: [{
        price: priceLookup[plano],
        quantity: 1
      }],
      mode: 'subscription',
      success_url: 'https://corretorcerto.netlify.app/sucesso.html',
      cancel_url: 'https://corretorcerto.netlify.app/planos.html'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id })
    };

  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message })
    };
  }
};
