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
exports.sendOtpEmail = sendOtpEmail;
const brevoMailer_1 = require("./brevoMailer");
function sendOtpEmail(to, otp) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = `
    <div style="font-family: Arial, sans-serif">
      <h2>Your TailMate Verification Code</h2>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This code is valid for <strong>30 seconds</strong>.</p>
    </div>
  `;
        (0, brevoMailer_1.sendBrevoEmail)({
            to,
            subject: "Your TailMate OTP Code",
            html,
            text: `Your TailMate OTP is ${otp}. Valid for 30 seconds.`,
        });
    });
}
