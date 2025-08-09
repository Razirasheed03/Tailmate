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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../../utils/jwt");
class AuthService {
    constructor(_userRepo) {
        this._userRepo = _userRepo;
        this.signup = (user) => __awaiter(this, void 0, void 0, function* () {
            const existing = yield this._userRepo.findByEmail(user.email);
            if (existing)
                throw new Error("User already exists");
            const otp = (0, crypto_1.randomInt)(100000, 999999).toString();
            const hashedPassword = yield bcryptjs_1.default.hash(user.password, 10);
            const key = `signup:${user.email}`;
            const createdAt = Date.now();
            yield redisClient_1.default.setEx(key, 300, JSON.stringify(Object.assign(Object.assign({}, user), { password: hashedPassword, isAdmin: false, otp, createdAt })));
            yield (0, sendEmail_1.sendOtpEmail)(user.email, otp);
            return { message: "OTP sent to email. Please verify." };
        });
        this.verifyOtp = (email, otp) => __awaiter(this, void 0, void 0, function* () {
            const key = `signup:${email}`;
            const redisData = yield redisClient_1.default.get(key);
            console.log("redis key in verifyOtp", redisData);
            if (!redisData)
                throw new Error("OTP expired or not found");
            const parsed = JSON.parse(redisData);
            if (!parsed.createdAt || Date.now() - parsed.createdAt > 30 * 1000) {
                throw new Error("OTP expired");
            }
            if (parsed.otp !== otp)
                throw new Error("Invalid OTP");
            const { otp: _ } = parsed, userData = __rest(parsed, ["otp"]);
            const createdUser = yield this._userRepo.createUser(userData);
            console.log("VALUES for verification:", "Submitted OTP:", otp, "Redis object:", parsed, "CreatedAt diff (ms):", Date.now() - parsed.createdAt);
            // const token = jwt.sign({ id: createdUser._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
            // await redisClient.del(key);
            // return { token, user: createdUser };
            const accessToken = (0, jwt_1.generateAccessToken)(createdUser._id.toString());
            const refreshToken = (0, jwt_1.generateRefreshToken)(createdUser._id.toString());
            // Store refreshToken in Redis for validation/revocation
            yield redisClient_1.default.setEx(`refresh:${createdUser._id}`, 7 * 24 * 60 * 60, // 7 days in seconds
            refreshToken);
            yield redisClient_1.default.del(key);
            // Return both tokens
            return { accessToken, refreshToken, user: createdUser };
        });
        this.resendOtp = (email) => __awaiter(this, void 0, void 0, function* () {
            const key = `signup:${email}`;
            const redisData = yield redisClient_1.default.get(key);
            console.log('Redis after resend: ', redisData);
            if (!redisData)
                throw new Error("OTP expired or not found, signup again.");
            const parsed = JSON.parse(redisData);
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            parsed.otp = otp;
            parsed.createdAt = Date.now();
            yield redisClient_1.default.setEx(key, 300, JSON.stringify(parsed)); //5 min for resended otp set aavan.
            console.log("parsed.createdAT", parsed.createdAt);
            yield (0, sendEmail_1.sendOtpEmail)(email, otp);
        });
        this.refreshToken = (refreshToken) => __awaiter(this, void 0, void 0, function* () {
            if (!refreshToken)
                throw new Error("No refresh token provided");
            let payload;
            try {
                payload = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_SECRET);
            }
            catch (_a) {
                throw new Error("Refresh token invalid or expired");
            }
            // Type check and extract user id from payload
            let userId;
            if (typeof payload === "object" && payload && "id" in payload) {
                userId = payload.id;
            }
            else {
                throw new Error("Invalid refresh token payload - user id missing.");
            }
            // Check against Redis
            const storedToken = yield redisClient_1.default.get(`refresh:${userId}`);
            if (storedToken !== refreshToken)
                throw new Error("Refresh token is revoked or does not match");
            // Generate new access token
            const accessToken = (0, jwt_1.generateAccessToken)(userId);
            return { accessToken };
        });
        this.login = (email, password) => __awaiter(this, void 0, void 0, function* () {
            const user = yield this._userRepo.findByEmail(email);
            if (!user)
                throw new Error("Invalid email or password");
            const isMatch = yield bcryptjs_1.default.compare(password, user.password);
            if (!isMatch)
                throw new Error("Invalid email or password");
            const userId = user._id.toString();
            const accessToken = (0, jwt_1.generateAccessToken)(userId);
            const refreshToken = (0, jwt_1.generateRefreshToken)(userId);
            yield redisClient_1.default.setEx(`refresh:${userId}`, 7 * 24 * 60 * 60, refreshToken);
            return { accessToken, refreshToken, user };
        });
    }
}
exports.AuthService = AuthService;
