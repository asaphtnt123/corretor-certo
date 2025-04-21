const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Inicialização segura do Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error('Erro na inicialização do Firebase:', error);
  }
}

const db = admin.firestore();

exports.handler = async (event) => {
  // Verifica se o corpo do evento está em Base64 (comum em Netlify)
  const payload = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf-8') : event.body;
  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    console.error('Erro na validação do webhook:', err);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Evento de checkout concluído
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const { userId, planoId } = session.metadata;

    if (!userId || !planoId) {
      console.error('Metadata ausente:', session.metadata);
      return { statusCode: 400, body: 'Dados do usuário ou plano não encontrados.' };
    }

    try {
      // Atualiza o documento do usuário no Firestore
      await db.collection('usuarios').doc(userId).update({
        plano: planoId,
        planoAtivo: true,
        dataAdesao: admin.firestore.FieldValue.serverTimestamp(),
        dataExpiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      });

      console.log(`Plano ${planoId} atribuído ao usuário ${userId}`);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (error) {
      console.error('Erro ao atualizar Firestore:', error);
      return { statusCode: 500, body: 'Erro interno ao atualizar usuário.' };
    }
  }

  // Resposta padrão para outros eventos não tratados
  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
