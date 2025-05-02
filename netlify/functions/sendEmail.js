const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const { email, name } = JSON.parse(event.body);

  // Configuração do SMTP (HostGator)
  const transporter = nodemailer.createTransport({
    host: 'smtp.corretorcerto.online', // Ou 'mail.corretorcerto.online'
    port: 465, // SSL (ou 587 para TLS)
    secure: true, // true para 465, false para outras portas
    auth: {
      user: 'contato@corretorcerto.online',
      pass: process.env.SMTP_PASSWORD, // Senha do e-mail (definida no Netlify)
    },
  });

  const mailOptions = {
    from: '"Corretor Certo" <contato@corretorcerto.online>',
    to: email,
    subject: 'Bem-vindo ao Corretor Certo!',
    html: `
      <h1>Olá, ${name}!</h1>
      <p>Seu cadastro foi realizado com sucesso.</p>
      <p>Acesse: <a href="https://corretorcerto.netlify.app">corretorcerto.netlify.app</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { statusCode: 200, body: 'E-mail enviado!' };
  } catch (error) {
    return { statusCode: 500, body: 'Erro: ' + error.message };
  }
};
