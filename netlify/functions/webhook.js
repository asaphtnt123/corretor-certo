const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Inicialize o Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`
    };
  }

  // Tratar evento de pagamento bem-sucedido
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    
    // Obter ID do usuário (armazene no metadata durante o checkout)
    const userId = session.metadata.userId;
    const planoAdquirido = session.metadata.planoId;

    if (!userId || !planoAdquirido) {
      return {
        statusCode: 400,
        body: 'Dados do usuário não encontrados'
      };
    }

    // Atualizar documento do usuário no Firestore
    try {
      await db.collection('usuarios').doc(userId).update({
        plano: planoAdquirido,
        planoAtivo: true,
        dataExpiracaoPlano: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
      };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return {
        statusCode: 500,
        body: 'Erro ao atualizar dados do usuário'
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
};
