const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Configuração segura do Firebase Admin
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
    console.error('Erro na inicialização do Firebase:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error('Falha na inicialização do Firebase');
  }
}

const db = admin.firestore();
const logsCollection = db.collection('paymentLogs'); // Coleção para logs

exports.handler = async (event) => {
  // Cabeçalhos CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  // Verificação inicial da requisição
  if (!event.body || !event.headers['stripe-signature']) {
    console.error('Requisição inválida: corpo ou assinatura ausentes');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Requisição inválida' }),
      headers
    };
  }

  // Processamento do payload
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
    console.error('Erro na validação do webhook:', {
      message: err.message,
      stack: err.stack
    });
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Assinatura inválida' }),
      headers
    };
  }

  // Log do evento recebido
  await logsCollection.add({
    eventId: stripeEvent.id,
    type: stripeEvent.type,
    receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    payload: stripeEvent.data.object
  });

  // Processamento específico para checkout concluído
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const { userId, planoId } = session.metadata || {};

    // Validações robustas
    if (!userId || !planoId) {
      console.error('Metadados ausentes:', { session });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Metadados do usuário/plano ausentes' }),
        headers
      };
    }

    if (session.payment_status !== 'paid') {
      console.warn('Pagamento não concluído:', { session });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Pagamento não concluído' }),
        headers
      };
    }

    try {
      // Transação atômica no Firestore
      await db.runTransaction(async (transaction) => {
        const userRef = db.collection('usuarios').doc(userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error('Usuário não encontrado');
        }

        transaction.update(userRef, {
          plano: planoId,
          planoAtivo: true,
          dataAdesao: admin.firestore.FieldValue.serverTimestamp(),
          dataExpiracao: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
          ),
          ultimoPagamento: {
            valor: session.amount_total / 100, // Convertendo para reais
            data: admin.firestore.Timestamp.fromDate(new Date()),
            sessionId: session.id
          }
        });

        // Log da atualização
        await logsCollection.add({
          userId,
          planoId,
          sessionId: session.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'success'
        });
      });

      console.log(`Plano ${planoId} atribuído com sucesso ao usuário ${userId}`);
      return { 
        statusCode: 200, 
        body: JSON.stringify({ success: true }),
        headers
      };
    } catch (error) {
      console.error('Erro na transação:', {
        error: error.message,
        stack: error.stack,
        userId,
        planoId
      });

      // Log de erro
      await logsCollection.add({
        userId,
        planoId,
        sessionId: session.id,
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'failed'
      });

      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Falha ao processar pagamento' }),
        headers
      };
    }
  }

  // Resposta para outros tipos de evento
  return { 
    statusCode: 200, 
    body: JSON.stringify({ received: true }),
    headers
  };
};
