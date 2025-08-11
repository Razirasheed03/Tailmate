import nodemailer from "nodemailer";

export const sendResetPasswordLink = async (
  to: string,
  subject: string,
  text: string
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"TailMate" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Reset password email sent:", info.response);
  } catch (err) {
    console.error("Failed to send reset password mail:", err);
    throw err;
  }
};
