import nodemailer from "nodemailer";

export const sendOtpEmail = async (to: string, otp: string) => {
  console.log("📨 [OTP SMTP] INIT", {
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

  // ❗ Only verify SMTP locally
  if (process.env.NODE_ENV === "development") {
    try {
      console.log("📨 [OTP SMTP] VERIFY START");
      await transporter.verify();
      console.log("✅ [OTP SMTP] VERIFY SUCCESS");
    } catch (err) {
      console.error("❌ [OTP SMTP] VERIFY FAILED", err);
      throw err;
    }
  }

  const mailOptions = {
    from: `"TailMate Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your TailMate OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Your TailMate Verification Code</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This code is valid for <strong>2 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
    text: `Your TailMate OTP is ${otp}. It is valid for 30 seconds.`,
  };

  try {
    console.log("📨 [OTP SMTP] SEND START");
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [OTP SMTP] SEND SUCCESS", info.response);
  } catch (err) {
    console.error("❌ [OTP SMTP] SEND FAILED", err);
    throw err;
  }
};
