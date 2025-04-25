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
    const { planoId, email, tipo } = JSON.parse(event.body);
    
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

    // 5. Configuração dos planos
    const priceIds = {
      // Planos de assinatura (originais - mantidos como estavam)
      basico: process.env.STRIPE_PRICE_BASICO,
      profissional: process.env.STRIPE_PRICE_PROFISSIONAL,
      premium: process.env.STRIPE_PRICE_PREMIUM,
      
      // Anúncios avulsos (novos - adicionados)
      anuncio_5dias: process.env.STRIPE_PRICE_ANUNCIO_5DIAS,
      anuncio_10dias: process.env.STRIPE_PRICE_ANUNCIO_10DIAS,
      anuncio_20dias: process.env.STRIPE_PRICE_ANUNCIO_20DIAS
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

    // 6. Determina o modo de pagamento baseado no tipo
    const isSubscription = !tipo || tipo === 'assinatura';
    const paymentMode = isSubscription ? 'subscription' : 'payment';

    // 7. Criação da sessão de checkout (mantendo o original com adaptações)
    const sessionParams = {
      payment_method_types: ['card', 'pix'], // Adicionado Pix como opção
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      mode: paymentMode,
      success_url: `${process.env.URL}/sucesso.html?session_id={CHECKOUT_SESSION_ID}&plano=${planoId}`,
      cancel_url: `${process.env.URL}/planos.html`,
      customer_email: email,
      metadata: { 
        planoId,
        email,
        tipo: tipo || 'assinatura' // Mantém compatibilidade
      }
    };

    // 8. Adiciona configurações específicas para anúncios avulsos
    if (!isSubscription) {
      const { dias } = JSON.parse(event.body);
      sessionParams.payment_intent_data = {
        description: `Anúncio avulso - ${dias} dias de visibilidade`
      };
      sessionParams.success_url = `${process.env.URL}/sucesso-anuncio.html?session_id={CHECKOUT_SESSION_ID}&dias=${dias}`;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Sessão criada com sucesso:', session.id);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        tipo: tipo || 'assinatura'
      }),
    };

  } catch (error) {
    // 9. Tratamento detalhado de erros
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
