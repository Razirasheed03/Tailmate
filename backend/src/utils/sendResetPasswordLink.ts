import nodemailer from "nodemailer";

export const sendResetPasswordLink = async (
  to: string,
  subject: string,
  resetUrl: string
) => {
  console.log("📨 [RESET SMTP] INIT", {
    to,
    at: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // ❗ DO NOT verify SMTP in production (Render blocks it)
  if (process.env.NODE_ENV === "development") {
    try {
      console.log("📨 [RESET SMTP] VERIFY START");
      await transporter.verify();
      console.log("✅ [RESET SMTP] VERIFY SUCCESS");
    } catch (err) {
      console.error("❌ [RESET SMTP] VERIFY FAILED", err);
      throw err;
    }
  }

  const mailOptions = {
    from: `"TailMate Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your <strong>TailMate</strong> account.</p>
        <p>Click the button below to reset your password:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #e4a574; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 25px; font-weight: bold;">
            Reset My Password
          </a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>

        <p><strong>This link will expire in 1 hour.</strong></p>

        <p>If you did not request this password reset, please ignore this email.</p>

        <hr style="margin: 30px 0; border: 1px solid #eee;" />

        <p style="color: #888; font-size: 12px;">
          This is an automated message from TailMate. Please do not reply.
        </p>
      </div>
    `,
    text: `
Password Reset Request

We received a request to reset your TailMate password.

Reset your password using the link below:
${resetUrl}

This link will expire in 1 hour.

If you did not request this, please ignore this message.
    `,
  };

  try {
    console.log("📨 [RESET SMTP] SEND START");
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [RESET SMTP] SEND SUCCESS", info.response);
  } catch (err) {
    console.error("❌ [RESET SMTP] SEND FAILED", err);
    throw err;
  }
};
