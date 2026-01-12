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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBrevoEmail = sendBrevoEmail;
const axios_1 = __importDefault(require("axios"));
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
function sendBrevoEmail(params) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { to, subject, html, text } = params;
        try {
            console.log("📨 [BREVO] INIT", { to, subject });
            yield axios_1.default.post(BREVO_ENDPOINT, {
                sender: {
                    email: process.env.BREVO_SENDER_EMAIL,
                    name: process.env.BREVO_SENDER_NAME || "TailMate Support",
                },
                to: [{ email: to }],
                subject,
                htmlContent: html,
                textContent: text,
            }, {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 10000, // safety timeout
            });
            console.log("✅ [BREVO] SENT", { to });
        }
        catch (err) {
            console.error("❌ [BREVO] FAILED", {
                to,
                message: err === null || err === void 0 ? void 0 : err.message,
                status: (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status,
                data: (_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.data,
            });
        }
    });
}
