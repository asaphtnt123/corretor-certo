const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Verifica o método HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ 
        error: 'Method Not Allowed',
        message: 'Apenas requisições POST são permitidas' 
      }),
      headers: { 'Allow': 'POST' }
    };
  }

  try {
    // Parse e validação dos dados de entrada
    const { planoId, email, successUrl } = JSON.parse(event.body);
    
    if (!planoId || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Dados incompletos',
          required: ['planoId', 'email'],
          received: { planoId, email }
        })
      };
    }

    // Configuração dos planos disponíveis
    const planos = {
      basico: { 
        price_id: process.env.STRIPE_PRICE_BASICO, // Prefira usar price_ids do Stripe
        nome: "Plano Básico",
        descricao: "Inclui 5 anúncios ativos e 1 destaque por semana"
      },
      profissional: { 
        price_id: process.env.STRIPE_PRICE_PROFISSIONAL,
        nome: "Plano Profissional",
        descricao: "Inclui 15 anúncios ativos e 3 destaques por 2 semanas"
      },
      premium: { 
        price_id: process.env.STRIPE_PRICE_PREMIUM,
        nome: "Plano Premium", 
        descricao: "Anúncios ilimitados e 5 destaques por 2 semanas"
      }
    };

    const plano = planos[planoId];
    
    if (!plano) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Plano inválido',
          planos_disponiveis: Object.keys(planos)
        })
      };
    }

    // Criação da sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: plano.price_id, // Usando price_id do Stripe
        quantity: 1,
      }],
      mode: 'subscription', // Modo subscription para pagamentos recorrentes
      metadata: {
        plano_id: planoId,
        user_email: email,
        app: 'corretor_certo'
      },
      customer_email: email,
      subscription_data: {
        metadata: {
          plano_id: planoId // Repete nos metadados da subscription
        }
      },
      success_url: successUrl || `${process.env.DOMAIN}/sucesso.html?session_id={CHECKOUT_SESSION_ID}&plano=${planoId}`,
      cancel_url: `${process.env.DOMAIN}/planos.html`,
      locale: 'pt-BR',
      automatic_tax: { enabled: true }, // Habilita cálculo automático de impostos
      phone_number_collection: {
        enabled: true // Coleta telefone do cliente
      },
      invoice_creation: {
        enabled: true // Habilita criação de faturas
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        plano: planoId,
        success_url: session.success_url
      }),
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    };

  } catch (error) {
    console.error('Erro no processamento:', {
      error: error.message,
      stack: error.stack,
      event: event
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro interno no servidor',
        message: 'Não foi possível criar a sessão de pagamento',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};
