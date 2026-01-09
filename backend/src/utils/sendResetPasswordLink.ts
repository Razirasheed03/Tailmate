import { mailer } from "./mailer";

export const sendResetPasswordLink = async (
  to: string,
  subject: string,
  resetUrl: string
): Promise<void> => {
  console.log("📨 [RESET EMAIL] QUEUED", {
    to,
    at: new Date().toISOString(),
  });

  mailer
    .sendMail({
      from: `"TailMate Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p><b>Link expires in 1 hour</b></p>
      `,
      text: `Reset your password: ${resetUrl}`,
    })
    .then(() => {
      console.log("✅ [RESET EMAIL] SENT", to);
    })
    .catch((err) => {
      console.error("❌ [RESET EMAIL] FAILED", {
        to,
        message: err.message,
      });
    });
};
