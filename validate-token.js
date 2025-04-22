// /.netlify/functions/validate-token
const admin = require('firebase-admin');

// Inicialize o Firebase Admin (configuração omitida por segurança)

exports.handler = async (event) => {
  try {
    const token = event.headers.authorization.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        userId: decodedToken.uid,
        email: decodedToken.email
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Token inválido' })
    };
  }
};
