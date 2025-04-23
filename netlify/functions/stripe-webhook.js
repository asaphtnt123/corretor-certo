if (stripeEvent.type === 'checkout.session.completed') {
  const session = stripeEvent.data.object;
  const email = session.customer_email;
  const plano = session.metadata?.plano;

  if (email && plano) {
    try {
      const db = admin.firestore();

      // Busca o documento do usuário com esse e-mail
      const snapshot = await db.collection('users').where('email', '==', email).get();

      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          doc.ref.update({ plano });
        });
        return { statusCode: 200, body: 'Plano atualizado com sucesso!' };
      } else {
        return { statusCode: 404, body: 'Usuário não encontrado com esse e-mail.' };
      }

    } catch (e) {
      return { statusCode: 500, body: 'Erro ao atualizar plano no Firestore.' };
    }
  }
}
