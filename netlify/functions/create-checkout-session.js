// netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Mapeamento dos IDs de preço do Stripe
const STRIPE_PRICES = {
  basico: 'price_1PJtZ6Jw',   // Substitua pelo ID real do seu preço no Stripe
  profissional: 'price_1PJtZ7Jw', // Substitua pelo ID real
  premium: 'price_1PJtZ8Jw'    // Substitua pelo ID real
};

exports.handler = async (event) => {
  // Configuração de CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Lidar com requisições OPTIONS para CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Verificar método HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // Verificar corpo da requisição
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Corpo da requisição ausente' })
      };
    }

    const { planoId, userId, userEmail } = JSON.parse(event.body);
    
    // Validação
    if (!planoId || !userId || !userEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Campos obrigatórios faltando',
          required: ['planoId', 'userId', 'userEmail']
        })
      };
    }

    // Verificar se o plano existe
    if (!STRIPE_PRICES[planoId]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Plano inválido',
          availablePlans: Object.keys(STRIPE_PRICES)
        })
      };
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [{
        price: STRIPE_PRICES[planoId],
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: userEmail,
      metadata: {
        userId,
        planoId,
        environment: process.env.NETLIFY_DEV ? 'development' : 'production'
      },
      success_url: `${process.env.URL}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/planos.html`,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hora de expiração
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        id: session.id,
        url: session.url
      })
    };

  } catch (error) {
    console.error('Erro no servidor:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno no servidor',
        message: error.message 
      })
    };
  }
};
