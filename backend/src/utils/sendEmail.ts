import { mailer } from "./mailer";

export const sendOtpEmail = async (
  to: string,
  otp: string
): Promise<void> => {
  console.log("📨 [OTP EMAIL] QUEUED", {
    to,
    at: new Date().toISOString(),
  });

  // 🔥 FIRE AND FORGET — DO NOT AWAIT
  mailer
    .sendMail({
      from: `"TailMate Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your TailMate OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Your TailMate Verification Code</h2>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code is valid for <b>5 minutes</b>.</p>
        </div>
      `,
      text: `Your TailMate OTP is ${otp}. Valid for 5 minutes.`,
    })
    .then(() => {
      console.log("✅ [OTP EMAIL] SENT", to);
    })
    .catch((err) => {
      console.error("❌ [OTP EMAIL] FAILED", {
        to,
        message: err.message,
      });
    });
};
