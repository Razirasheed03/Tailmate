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
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your password</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
      <tr>
        <td align="center">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="background:#ffffff; border-radius:8px; overflow:hidden;"
          >

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
                  <a
                    href="${resetUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      background:#e4a574;
                      color:#ffffff;
                      padding:14px 36px;
                      text-decoration:none;
                      border-radius:32px;
                      font-weight:bold;
                      display:inline-block;
                      font-size:15px;
                    "
                  >
                    Reset Password
                  </a>
                </div>

                <!-- Divider -->
                <hr style="border:none; border-top:1px solid #e6e6e6; margin:32px 0;" />

                <!-- Fallback -->
                <p style="color:#777; font-size:13px; margin-bottom:10px;">
                  If the button doesn’t work, copy and paste the link below into your browser:
                </p>

                <!-- URL isolated -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="background:#f6f6f6; border-radius:6px;"
                >
                  <tr>
                    <td style="padding:12px; font-size:13px; word-break:break-all; font-family:monospace;">
                      <a
                        href="${resetUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="color:#e4a574; text-decoration:none;"
                      >
                        ${resetUrl}
                      </a>
                    </td>
                  </tr>
                </table>

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
            text: [
                "TailMate Password Reset",
                "",
                resetUrl,
                "",
                "This link expires in 1 hour.",
                "If you did not request this, please ignore this email."
            ].join("\n"),
        });
    });
}
