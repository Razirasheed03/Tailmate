import nodemailer from "nodemailer";

export const sendResetPasswordLink = async (
  to: string,
  subject: string,
  resetUrl: string
) => {
  console.log("📧 [SMTP] INIT", {
    to,
    at: new Date().toISOString(),
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 🔍 Verify SMTP connectivity (IMPORTANT)
  try {
    console.log("📧 [SMTP] VERIFY START");
    await transporter.verify();
    console.log("✅ [SMTP] VERIFY SUCCESS");
  } catch (verifyErr) {
    console.error("❌ [SMTP] VERIFY FAILED", verifyErr);
    throw verifyErr;
  }

  const mailOptions = {
    from: `"TailMate" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
      </div>
    `,
    text: `Reset your password using this link:\n${resetUrl}`,
  };

  try {
    console.log("📧 [SMTP] SEND START", new Date().toISOString());
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [SMTP] SEND SUCCESS", info.response);
  } catch (err) {
    console.error("❌ [SMTP] SEND FAILED", err);
    throw err;
  }
};
