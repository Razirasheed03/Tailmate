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
exports.AuthController = void 0;
const userSchemas_1 = require("../../validation/userSchemas");
class AuthController {
    constructor(_authService) {
        this._authService = _authService;
        this.signup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            // 1. Zod validation FIRST
            const parsed = userSchemas_1.signupSchema.safeParse(req.body);
            if (!parsed.success) {
                // Send the first error to frontend (or list all errors as an array)
                return res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    errors: parsed.error.issues, // Optionally: send all errors
                });
            }
            // 2. Data is guaranteed valid and typed!
            const { username, email, password } = parsed.data;
            // If you want to keep confirmPassword out of your DB/user object, drop it here
            try {
                // Pass only the needed fields (without confirmPassword) to the service
                const user = yield this._authService.signup({ username, email, password });
                res.status(201).json({ success: true, user });
            }
            catch (err) {
                next(err);
            }
        });
        this.verifyOtp = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, otp } = req.body;
                const result = yield this._authService.verifyOtp(email, otp);
                res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (err) {
                console.error(err);
                next(err);
            }
        });
    }
}
exports.AuthController = AuthController;
