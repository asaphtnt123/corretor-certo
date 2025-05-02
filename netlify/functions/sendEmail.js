const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const { email, name } = JSON.parse(event.body);

  // Configuração SMTP (HostGator)
  const transporter = nodemailer.createTransport({
    host: 'mail.corretorcerto.online', // Ou smtp.corretorcerto.online
    port: 465, // SSL (587 para TLS)
    secure: true, // true para 465, false para outras portas
    auth: {
      user: 'contato@corretorcerto.online',
      pass: process.env.SMTP_PASSWORD, // Senha do e-mail
    },
  });

  const mailOptions = {
    from: '"Corretor Certo" <contato@corretorcerto.online>',
    to: email,
    subject: 'Bem-vindo ao Corretor Certo!',
    html: `<p>Olá ${name}, seu cadastro foi realizado com sucesso!</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'E-mail enviado!' }),
    };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falha ao enviar e-mail. Verifique os logs.' }),
    };
  }
};
