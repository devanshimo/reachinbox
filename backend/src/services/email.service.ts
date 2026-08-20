import nodemailer, {
  Transporter,
} from "nodemailer";

let transporter: Transporter | null = null;

export async function getMailTransporter() {
  if (transporter) {
    return transporter;
  }

  const account =
    await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  console.log("Ethereal account created:");
  console.log("SMTP user:", account.user);

  return transporter;
}
export async function sendEmail({
  from,
  to,
  subject,
  body,
}: {
  from: string;
  to: string;
  subject: string;
  body: string;
}) {
  const transporter =
    await getMailTransporter();

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: body,
  });

  const previewUrl =
    nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl,
  };
}