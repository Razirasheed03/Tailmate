import nodemailer from "nodemailer";

console.log("📧 Initializing Gmail SMTP transporter...");

export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // MUST be false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
  tls: {
    rejectUnauthorized: false,
  },
});

mailer.on("error", (err) => {
  console.error("❌ [MAILER GLOBAL ERROR]", err.message);
});

console.log("✅ Gmail SMTP transporter ready");
