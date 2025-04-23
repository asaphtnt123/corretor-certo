const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    // Verifica o método HTTP
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    // Parse dos dados recebidos
    const { planoId, userId, userEmail, userIP, deviceInfo } = JSON.parse(event.body);

    // Validação básica
    if (!planoId || !userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dados incompletos' })
      };
    }

    // Configuração dos planos no Stripe
    const stripePlans = {
      basico: 'price_123456789', // Substitua pelos seus IDs reais do Stripe
      profissional: 'price_234567890',
      premium: 'price_345678901'
    };

    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: stripePlans[planoId],
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.URL}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/planos`,
      customer_email: userEmail,
      metadata: {
        user_id: userId,
        user_ip: userIP,
        device_info: JSON.stringify(deviceInfo)
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id })
    };

  } catch (error) {
    console.error('Erro na função:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro interno no servidor',
        details: error.message 
      })
    };
  }
};
