import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { formatRupees } from "../utils/money.js";

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
};

async function deliver({ to, subject, text }) {
  if (env.EMAIL_MODE === "console") {
    console.log(`\n📧 EMAIL → ${to}\n   Subject: ${subject}\n${text}\n`);
    return;
  }
  await getTransporter().sendMail({ from: env.MAIL_FROM, to, subject, text });
}

export async function sendPasswordResetEmail(user, rawToken) {
  const link = `${env.CLIENT_ORIGIN}/reset-password?token=${rawToken}`;
  await deliver({
    to: user.email,
    subject: "Reset your Bytebank password",
    text: `Hi ${user.name},\n\nReset your password: ${link}\n\nThis link is valid for 30 minutes. If you didn't ask for this, ignore this email.`,
  });
}

export async function sendPaymentReceived(toUser, { amountPaise, fromName, paymentId }) {
  await deliver({
    to: toUser.email,
    subject: `You received ${formatRupees(amountPaise)} from ${fromName}`,
    text: `Hi ${toUser.name},\n\n${fromName} sent you ${formatRupees(amountPaise)}.\nPayment ID: ${paymentId}\n\nBytebank is a simulated bank. No real money moved.`,
  });
}
