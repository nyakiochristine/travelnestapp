const nodemailer = require('nodemailer');

const configured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM);
const transporter = () => nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });

async function sendEmail({ to, subject, text, html }) {
  if (!configured()) return false;
  try {
    await transporter().sendMail({ from: process.env.MAIL_FROM, to, subject, text, html });
    return true;
  } catch (error) {
    console.error('Email delivery failed:', error.message);
    return false;
  }
}

module.exports = { sendEmail, isEmailConfigured: configured };
