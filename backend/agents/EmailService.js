const nodemailer = require('nodemailer');

function getTransporter(smtpConfig) {
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: false,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass
    }
  });
}

async function sendEmail({ to, from, subject, body, smtpConfig }) {
  const transporter = getTransporter(smtpConfig);

  const info = await transporter.sendMail({
    from: `"${from.name}" <${from.email}>`,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>')
  });

  return info;
}

module.exports = { sendEmail };
