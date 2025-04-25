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
    const { planoId, email, tipo, dias } = JSON.parse(event.body);
    
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

    // 5. Configuração dos planos (agora incluindo anúncios avulsos)
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
      console.error('Plano inválido:', planoId);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Plano inválido',
          availablePlans: Object.keys(priceIds)
        }),
      };
    }

    // 6. Configuração dinâmica baseada no tipo (assinatura ou anúncio avulso)
    const isSubscription = tipo !== 'anuncio_avulso';
    const successUrl = isSubscription 
      ? `${process.env.URL}/sucesso.html?session_id={CHECKOUT_SESSION_ID}&plano=${planoId}`
      : `${process.env.URL}/sucesso-anuncio.html?session_id={CHECKOUT_SESSION_ID}&dias=${dias}`;

    // 7. Criação da sessão de checkout
    const sessionParams = {
      payment_method_types: ['card', 'pix'], // Adicionado Pix como opção
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: `${process.env.URL}/planos.html`,
      customer_email: email,
      metadata: { 
        planoId,
        email,
        tipo: tipo || 'assinatura',
        ...(dias && { dias }) // Inclui dias apenas se existir
      },
      payment_intent_data: !isSubscription ? {
        description: `Anúncio avulso - ${dias} dias de visibilidade`
      } : undefined,
      subscription_data: isSubscription ? {
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        }
      } : undefined
    };

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
    // 8. Tratamento detalhado de erros
    console.error('ERRO CRÍTICO:', {
      message: error.message,
      stack: error.stack,
      rawEvent: event
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro ao criar sessão de pagamento',
        details: process.env.NETLIFY_DEV ? error.message : 'Contate o suporte',
        suggestion: 'Verifique os logs do servidor para mais detalhes'
      }),
    };
  }
};
