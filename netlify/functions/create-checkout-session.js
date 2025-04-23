// netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Verifica o método HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const { planoId } = JSON.parse(event.body);
    
    // Validação do planoId
    if (!planoId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'planoId é obrigatório' }),
      };
    }

    const planos = {
      basico: { preco: 1090, nome: "Plano Básico" },
      profissional: { preco: 5990, nome: "Plano Profissional" },
      premium: { preco: 9990, nome: "Plano Premium" }
    };

    const plano = planos[planoId];
    
    // Verifica se o plano existe
    if (!plano) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Plano inválido' }),
      };
    }

    const session = await stripe.checkout.sessions.create({

      metadata: {
  userId: event.headers['x-user-id'], // Ou do corpo da requisição, dependendo da sua autenticação
  planoId: planoId
},
      
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { 
            name: plano.nome,
            description: `Assinatura ${plano.nome} - Corretor Certo`
          },
          unit_amount: plano.preco,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.DOMAIN}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/cancelado`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
    };

  } catch (error) {
    console.error('Erro no pagamento:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro ao processar pagamento',
        details: error.message 
      }),
    };
  }
};
