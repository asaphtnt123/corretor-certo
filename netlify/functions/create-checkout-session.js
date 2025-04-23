const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // 1. Configuração inicial
  console.log('Função invocada com:', JSON.parse(event.body));
  
  try {
    // 2. Validação do método HTTP
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    // 3. Parse dos dados
    const { planoId, email } = JSON.parse(event.body);
    
    // 4. Validação dos dados
    if (!planoId || !email) {
      console.error('Dados incompletos recebidos');
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Dados incompletos',
          details: 'planoId e email são obrigatórios'
        }),
      };
    }

    // 5. Configuração simplificada dos planos (use price_ids do Stripe)
    const priceIds = {
      basico: process.env.STRIPE_PRICE_BASICO,
      profissional: process.env.STRIPE_PRICE_PROFISSIONAL,
      premium: process.env.STRIPE_PRICE_PREMIUM
    };

    const priceId = priceIds[planoId];
    
    if (!priceId) {
      console.error('Plano inválido:', planoId);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Plano inválido',
          availablePlans: Object.keys(priceIds)
        }),
      };
    }

    // 6. Criação da sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.URL}/sucesso.html?session_id={CHECKOUT_SESSION_ID}&plano=${planoId}`,
      cancel_url: `${process.env.URL}/planos.html`,
      customer_email: email,
      metadata: { planoId, email }
    });

    console.log('Sessão criada com sucesso:', session.id);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url
      }),
    };

  } catch (error) {
    // 7. Tratamento detalhado de erros
    console.error('ERRO CRÍTICO:', {
      message: error.message,
      stack: error.stack,
      rawEvent: event
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro ao criar sessão de pagamento',
        details: process.env.NETLIFY_DEV ? error.message : 'Contate o suporte'
      }),
    };
  }
};
