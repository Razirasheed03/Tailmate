import nodemailer from "nodemailer";

export const sendOtpEmail = async (to: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or "hotmail", or use `host`/`port` for custom SMTP
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"TailMate" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your TailMate OTP Code",
    text: `Your OTP for verification is: ${otp}. It is valid for 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};
