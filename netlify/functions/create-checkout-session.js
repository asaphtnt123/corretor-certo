const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  try {
    // 1. Validação do método HTTP
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    // 2. Parse e validação dos dados
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Corpo da requisição inválido' })
      };
    }

    const { planoId, email, tipo, dias } = requestBody;
    
    if (!planoId || !email) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Dados incompletos',
          details: 'planoId e email são obrigatórios'
        })
      };
    }

    // 3. Configuração dos planos (CORREÇÃO AQUI - removido o }; extra)
    const priceIds = {
      // Planos de assinatura
      basico: process.env.STRIPE_PRICE_BASICO,
      profissional: process.env.STRIPE_PRICE_PROFISSIONAL,
      premium: process.env.STRIPE_PRICE_PREMIUM,
      
      // Anúncios avulsos
      anuncio_5dias: process.env.STRIPE_PRICE_ANUNCIO_5DIAS,
      anuncio_10dias: process.env.STRIPE_PRICE_ANUNCIO_10DIAS,
      anuncio_20dias: process.env.STRIPE_PRICE_ANUNCIO_20DIAS
    }; // <-- Este é o único fechamento necessário

    const priceId = priceIds[planoId];
    
    if (!priceId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Plano inválido',
          availablePlans: Object.keys(priceIds)
        })
      };
    }

    // 4. Configuração da sessão
    const isSubscription = tipo !== 'anuncio_avulso';
    const successUrl = `${process.env.URL}/sucesso.html?session_id={CHECKOUT_SESSION_ID}&plano=${planoId}`;
    const cancelUrl = `${process.env.URL}/planos.html`;

    const sessionParams = {
      payment_method_types: ['card', 'pix'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: { 
        planoId,
        email,
        tipo: tipo || 'assinatura',
        ...(dias && { dias })
      }
    };

    // 5. Adiciona configurações específicas
    if (!isSubscription) {
      sessionParams.payment_intent_data = {
        description: `Anúncio avulso - ${dias} dias de visibilidade`
      };
    } else {
      sessionParams.subscription_data = {
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' }}
      };
    }

    // 6. Cria a sessão
    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        tipo: tipo || 'assinatura'
      })
    };

  } catch (error) {
    console.error('ERRO:', {
      message: error.message,
      stack: error.stack,
      event: event
    });

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Erro ao processar pagamento',
        ...(process.env.NETLIFY_DEV && { details: error.message })
      })
    };
  }
};
