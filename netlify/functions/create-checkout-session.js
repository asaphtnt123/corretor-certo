const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const STRIPE_PRICES = {
  basico: 'prod_SBDhbajzuHncVW',   // Substitua pelo ID real
  profissional: 'prod_SBDiHBImSiF0dg', // Substitua pelo ID real
  premium: 'prod_SBDiJUSJJ6H363'    // Substitua pelo ID real
};

exports.handler = async (event) => {
  console.log('Recebida requisição para criar sessão');
  
  try {
    // Verificação básica
    if (!event.body) {
      console.error('Corpo da requisição ausente');
      return { statusCode: 400, body: JSON.stringify({ error: 'Dados ausentes' }) };
    }

    const { planoId, userId, userEmail } = JSON.parse(event.body);
    console.log('Dados recebidos:', { planoId, userId, userEmail });

    // Validação dos dados
    if (!planoId || !userId || !userEmail) {
      console.error('Dados incompletos');
      return { statusCode: 400, body: JSON.stringify({ error: 'Dados incompletos' }) };
    }

    // Mapeamento de planos para preços do Stripe
    const PRICE_IDS = {
      basico: 'price_XXXX', // Substitua pelo ID real
      profissional: 'price_XXXX', // Substitua pelo ID real
      premium: 'price_XXXX' // Substitua pelo ID real
    };

    const priceId = PRICE_IDS[planoId];
    if (!priceId) {
      console.error('Plano não encontrado:', planoId);
      return { statusCode: 400, body: JSON.stringify({ error: 'Plano inválido' }) };
    }

    console.log('Criando sessão no Stripe para o preço:', priceId);
    
    // Criação da sessão
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      customer_email: userEmail,
      success_url: `${process.env.DOMAIN}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/planos.html`,
      metadata: { userId, planoId }
    });

    console.log('Sessão criada com sucesso:', session.id);
    return { statusCode: 200, body: JSON.stringify({ id: session.id }) };

  } catch (error) {
    console.error('Erro detalhado:', {
      message: error.message,
      stack: error.stack,
      raw: error
    });
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Erro no processamento',
        details: error.message 
      }) 
    };
  }
};
