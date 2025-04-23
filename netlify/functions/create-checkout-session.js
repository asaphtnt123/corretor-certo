const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Verifica o método HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  try {
    // Verifica se o corpo da requisição está presente
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Corpo da requisição ausente' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    const { planoId, userId, userEmail } = JSON.parse(event.body);
    
    // Validação dos campos obrigatórios
    if (!planoId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Campos obrigatórios faltando',
          details: {
            missingPlanoId: !planoId,
            missingUserId: !userId
          }
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    // Mapeamento dos planos
    const planos = {
      basico: 'price_1RGrG5CaTJrTX5TuntwZRSX6',
      profissional: 'price_1RGrGnCaTJrTX5TuPBTU3gR3',
      premium: 'price_1RGrHCCaTJrTX5TuFX7GRVjv'
    };

    const priceId = planos[planoId];
    
    if (!priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Plano inválido',
          planosDisponiveis: Object.keys(planos)
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: userEmail,
      metadata: {
        userId: userId,
        planoId: planoId
      },
      success_url: `${process.env.DOMAIN}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/cancelado?session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hora
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error) {
    console.error('Erro no processamento:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro ao processar pagamento',
        details: process.env.NETLIFY_DEV ? error.message : undefined
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};
