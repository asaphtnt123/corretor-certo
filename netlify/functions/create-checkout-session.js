// netlify/functions/create-checkout-session.js
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

    const { planoId, userId } = JSON.parse(event.body);
    
    // Validação dos campos obrigatórios
    if (!planoId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Campos obrigatórios faltando',
          details: !planoId ? 'planoId é obrigatório' : 'userId é obrigatório'
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    const planos = {
      basico: { 
        preco: 2990, 
        nome: "Plano Básico",
        descricao: "Acesso aos recursos essenciais"
      },
      profissional: { 
        preco: 5990, 
        nome: "Plano Profissional",
        descricao: "Recursos avançados para profissionais"
      },
      premium: { 
        preco: 9990, 
        nome: "Plano Premium",
        descricao: "Solução completa com todos os recursos"
      }
    };

    const plano = planos[planoId];
    
    if (!plano) {
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
      payment_method_types: ['card', 'pix'], // Adicionado Pix como opção
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { 
            name: plano.nome,
            description: plano.descricao,
            metadata: {
              plano_id: planoId,
              user_id: userId
            }
          },
          unit_amount: plano.preco,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: event.headers['x-user-email'], // Opcional: captura email do header
      metadata: {
        userId: userId,
        planoId: planoId,
        environment: process.env.NETLIFY_DEV ? 'development' : 'production'
      },
      success_url: `${process.env.DOMAIN}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/cancelado?session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // Sessão expira em 1 hora
    });

    // Log seguro (não mostra dados sensíveis)
    console.log(`Checkout session criada para usuário ${userId}, plano ${planoId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        expiraEm: new Date(session.expires_at * 1000).toISOString()
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error) {
    // Log detalhado do erro (sem expor detalhes sensíveis ao cliente)
    console.error('Erro no processamento do pagamento:', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro ao processar pagamento',
        requestId: event.requestContext?.requestId
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};
