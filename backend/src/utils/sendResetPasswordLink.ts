import { sendBrevoEmail } from "./brevoMailer";

export async function sendResetPasswordLink(
  to: string,
  subject: string,
  resetUrl: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif">
      <h2>Password Reset</h2>
      <p>Click the button below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 1 hour.</p>
    </div>
  `;

  sendBrevoEmail({
    to,
    subject,
    html,
    text: `Reset your password: ${resetUrl}`,
  });
}
