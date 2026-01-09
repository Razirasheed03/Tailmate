import { sendBrevoEmail } from "./brevoMailer";

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif">
      <h2>Your TailMate Verification Code</h2>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This code is valid for <strong>30 seconds</strong>.</p>
    </div>
  `;

  // fire-and-forget (do not block signup)
  sendBrevoEmail({
    to,
    subject: "Your TailMate OTP Code",
    html,
    text: `Your TailMate OTP is ${otp}. Valid for 30 seconds.`,
  });
}
