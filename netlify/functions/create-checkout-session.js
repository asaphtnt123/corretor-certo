const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    // Verifica método HTTP
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    // Parse do corpo da requisição
    const { planoId, email, tipo, dias } = JSON.parse(event.body);

    // Validação dos dados
    if (!planoId || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'planoId e email são obrigatórios' }),
      };
    }

    // Configuração dos planos
    const priceIds = {
      // Planos de assinatura (originais)
      basico: process.env.STRIPE_PRICE_BASICO,
      profissional: process.env.STRIPE_PRICE_PROFISSIONAL,
      premium: process.env.STRIPE_PRICE_PREMIUM,
      
      // Anúncios avulsos (novos)
      anuncio_5dias: process.env.STRIPE_PRICE_ANUNCIO_5DIAS,
      anuncio_10dias: process.env.STRIPE_PRICE_ANUNCIO_10DIAS,
      anuncio_20dias: process.env.STRIPE_PRICE_ANUNCIO_20DIAS
    };

    const priceId = priceIds[planoId];
    if (!priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Plano inválido' }),
      };
    }

    // Configuração da sessão
    const isAnuncioAvulso = tipo === 'anuncio_avulso';
    const sessionParams = {
      payment_method_types: ['card', 'pix'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isAnuncioAvulso ? 'payment' : 'subscription',
      success_url: isAnuncioAvulso 
        ? `${process.env.URL}/sucesso-anuncio.html?session_id={CHECKOUT_SESSION_ID}`
        : `${process.env.URL}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/planos.html`,
      customer_email: email,
      metadata: { planoId, email, tipo: tipo || 'assinatura' }
    };

    // Adiciona descrição para anúncios avulsos
    if (isAnuncioAvulso && dias) {
      sessionParams.payment_intent_data = {
        description: `Anúncio avulso - ${dias} dias`
      };
      sessionParams.metadata.dias = dias;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
        tipo: tipo || 'assinatura'
      }),
    };

  } catch (error) {
    console.error('Erro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro ao processar pagamento',
        details: process.env.NETLIFY_DEV ? error.message : undefined
      }),
    };
  }
};
