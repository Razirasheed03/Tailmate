import axios from "axios";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export async function sendBrevoEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { to, subject, html, text } = params;

  try {
    console.log("📨 [BREVO] INIT", { to, subject });

    await axios.post(
      BREVO_ENDPOINT,
      {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL!,
          name: process.env.BREVO_SENDER_NAME || "TailMate Support",
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY!,
          "Content-Type": "application/json",
        },
        timeout: 10000, // safety timeout
      }
    );

    console.log("✅ [BREVO] SENT", { to });
  } catch (err: any) {
    console.error("❌ [BREVO] FAILED", {
      to,
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
  }
}
