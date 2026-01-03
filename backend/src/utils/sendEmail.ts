import nodemailer from "nodemailer";

export const sendOtpEmail = async (to: string, otp: string) => {
  console.log("📨 [OTP SMTP] INIT", {
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

  // 🔍 Step 1: Verify SMTP connectivity
  try {
    console.log("📨 [OTP SMTP] VERIFY START");
    await transporter.verify();
    console.log("✅ [OTP SMTP] VERIFY SUCCESS");
  } catch (verifyErr) {
    console.error("❌ [OTP SMTP] VERIFY FAILED", verifyErr);
    throw verifyErr;
  }

  const mailOptions = {
    from: `"TailMate" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your TailMate OTP Code",
    text: `Your OTP for verification is: ${otp}. It is valid for 2 minutes.`,
  };

  // 🔍 Step 2: Send mail
  try {
    console.log("📨 [OTP SMTP] SEND START", new Date().toISOString());
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [OTP SMTP] SEND SUCCESS", info.response);
  } catch (err) {
    console.error("❌ [OTP SMTP] SEND FAILED", err);
    throw err;
  }
};
