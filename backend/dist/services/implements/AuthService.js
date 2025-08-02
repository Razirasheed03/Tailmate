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
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const redisClient_1 = __importDefault(require("../../config/redisClient"));
const crypto_1 = require("crypto");
const sendEmail_1 = require("../../utils/sendEmail");
class AuthService {
    constructor(_userRepo) {
        this._userRepo = _userRepo;
        this.signup = (user) => __awaiter(this, void 0, void 0, function* () {
            console.log('🔍 AuthService.signup called with:', Object.assign(Object.assign({}, user), { password: '[HIDDEN]' }));
            const existing = yield this._userRepo.findByEmail(user.email);
            if (existing)
                throw new Error("User already exists");
            // Generate OTP
            const otp = (0, crypto_1.randomInt)(100000, 999999).toString();
            const hashedPassword = yield bcryptjs_1.default.hash(user.password, 10);
            const key = `signup:${user.email}`;
            yield redisClient_1.default.setEx(key, 300, JSON.stringify(Object.assign(Object.assign({}, user), { password: hashedPassword, otp })));
            yield (0, sendEmail_1.sendOtpEmail)(user.email, otp);
            return { message: "OTP sent to email. Please verify." };
        });
        this.verifyOtp = (email, otp) => __awaiter(this, void 0, void 0, function* () {
            const key = `signup:${email}`;
            const redisData = yield redisClient_1.default.get(key);
            if (!redisData) {
                throw new Error("OTP expired or not found");
            }
            const parsed = JSON.parse(redisData);
            if (parsed.otp !== otp) {
                throw new Error("Invalid OTP");
            }
            const hashedPassword = yield bcryptjs_1.default.hash(parsed.password, 10);
            const createdUser = yield this._userRepo.createUser(Object.assign({}, parsed));
            const token = jwt.sign({ id: createdUser._id }, process.env.JWT_SECRET, {
                expiresIn: "1d",
            });
            yield redisClient_1.default.del(key);
            return { token, user: createdUser };
        });
    }
}
exports.AuthService = AuthService;
