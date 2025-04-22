const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error('Erro na inicialização do Firebase:', error);
    throw error; // Força falha visível no log
  }
}

const db = admin.firestore();

exports.handler = async (event) => {
  const payload = event.isBase64Encoded 
    ? Buffer.from(event.body, 'base64').toString('utf-8') 
    : event.body;
  const sig = event.headers['stripe-signature'];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Erro na validação do webhook:', err);
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }) 
    };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  const session = stripeEvent.data.object;
  const { userId, planoId } = session.metadata || {};

  if (!userId || !planoId || session.payment_status !== 'paid') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Dados inválidos ou pagamento não concluído' })
    };
  }

  try {
    await db.collection('usuarios').doc(userId).update({
      plano: planoId,
      planoAtivo: true,
      dataAdesao: admin.firestore.FieldValue.serverTimestamp(),
      dataExpiracao: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      )
    });

    console.log(`Plano ${planoId} atribuído ao usuário ${userId}`);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Erro ao atualizar Firestore:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Erro interno ao atualizar usuário' }) 
    };
  }
};
