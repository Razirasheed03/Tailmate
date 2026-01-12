"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPasswordLink = sendResetPasswordLink;
const brevoMailer_1 = require("./brevoMailer");
function sendResetPasswordLink(to, subject, resetUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#ffffff; border-radius:8px; overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background:#e4a574; padding:24px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:26px;">TailMate</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin-top:0; color:#333;">Reset your password</h2>

                  <p style="color:#555; font-size:15px; line-height:22px;">
                    We received a request to reset your TailMate account password.
                    Click the button below to proceed.
                  </p>

                  <!-- Button -->
                  <div style="text-align:center; margin:32px 0;">
                    <a href="${resetUrl}"
                      style="
                        background:#e4a574;
                        color:#ffffff;
                        padding:14px 32px;
                        text-decoration:none;
                        border-radius:30px;
                        font-weight:bold;
                        display:inline-block;
                        font-size:15px;
                      ">
                      Reset Password
                    </a>
                  </div>

                  <!-- Fallback URL -->
                  <p style="color:#777; font-size:13px; line-height:20px;">
                    If the button doesn’t work, copy and paste this link into your browser:
                  </p>

                  <p style="word-break:break-all; font-size:13px;">
                    <a href="${resetUrl}" style="color:#e4a574;">
                      ${resetUrl}
                    </a>
                  </p>

                  <p style="margin-top:24px; color:#888; font-size:13px;">
                    ⏳ This link will expire in <strong>1 hour</strong>.
                  </p>

                  <p style="color:#999; font-size:13px;">
                    If you did not request a password reset, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f7f7f7; padding:16px; text-align:center;">
                  <p style="margin:0; font-size:12px; color:#999;">
                    © ${new Date().getFullYear()} TailMate. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
        (0, brevoMailer_1.sendBrevoEmail)({
            to,
            subject,
            html,
            text: `Reset your password using this link:\n\n${resetUrl}\n\nThis link expires in 1 hour.`,
        });
    });
}
