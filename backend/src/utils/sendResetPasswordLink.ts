import { sendBrevoEmail } from "./brevoMailer";

export async function sendResetPasswordLink(
  to: string,
  subject: string,
  resetUrl: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
            style="background:#ffffff; border-radius:8px; overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background:#e4a574; padding:24px; text-align:center;">
                <h1 style="margin:0; color:#ffffff; font-size:26px;">TailMate</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:32px;">
                <h2 style="margin-top:0; color:#333;">Reset your password</h2>

                <p style="color:#555; font-size:15px; line-height:22px;">
                  We received a request to reset your TailMate account password.
                  Click the button below to proceed.
                </p>

                <!-- Button -->
                <div style="text-align:center; margin:32px 0;">
                  <a
                    href="${resetUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      background:#e4a574;
                      color:#ffffff;
                      padding:14px 32px;
                      text-decoration:none;
                      border-radius:30px;
                      font-weight:bold;
                      display:inline-block;
                      font-size:15px;
                    "
                  >
                    Reset Password
                  </a>
                </div>

                <!-- Fallback text -->
                <p style="color:#777; font-size:13px; line-height:20px; margin-bottom:8px;">
                  If the button doesn’t work, copy and paste this link into your browser:
                </p>

                <!-- Fallback URL (isolated to avoid auto-link issues) -->
                <div
                  style="
                    background:#f6f6f6;
                    border-radius:4px;
                    padding:12px;
                    font-size:13px;
                    word-break:break-all;
                  "
                >
                  <a
                    href="${resetUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      color:#e4a574;
                      text-decoration:none;
                      font-family:monospace;
                    "
                  >
                    ${resetUrl}
                  </a>
                </div>

                <p style="margin-top:24px; color:#888; font-size:13px;">
                  ⏳ This link will expire in <strong>1 hour</strong>.
                </p>

                <p style="color:#999; font-size:13px;">
                  If you did not request a password reset, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f7f7f7; padding:16px; text-align:center;">
                <p style="margin:0; font-size:12px; color:#999;">
                  © ${new Date().getFullYear()} TailMate. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  sendBrevoEmail({
    to,
    subject,
    html,
    text: [
      "Reset your password",
      "",
      "We received a request to reset your TailMate account password.",
      "",
      resetUrl,
      "",
      "This link expires in 1 hour.",
      "",
      "If you did not request this, please ignore this email."
    ].join("\n"),
  });
}
