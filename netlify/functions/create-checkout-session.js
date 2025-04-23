const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const STRIPE_PRICES = {
  basico: 'prod_SBDhbajzuHncVW',   // Substitua pelo ID real
  profissional: 'prod_SBDiHBImSiF0dg', // Substitua pelo ID real
  premium: 'prod_SBDiJUSJJ6H363'    // Substitua pelo ID real
};

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Corpo da requisição ausente' }) };
    }

    const { planoId, userId, userEmail } = JSON.parse(event.body);
    
    if (!planoId || !userId || !userEmail) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Dados incompletos' }) 
      };
    }

    if (!STRIPE_PRICES[planoId]) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Plano inválido' }) 
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [{ price: STRIPE_PRICES[planoId], quantity: 1 }],
      mode: 'payment',
      customer_email: userEmail,
      metadata: { userId, planoId },
      success_url: `${process.env.DOMAIN}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/planos.html`,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ id: session.id, url: session.url }) 
    };

  } catch (error) {
    console.error('Erro:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Erro no servidor' }) 
    };
  }
};
