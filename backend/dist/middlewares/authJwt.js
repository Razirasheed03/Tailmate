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
exports.authJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/implements/user.model");
const authJwt = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
            return res.status(401).json({ success: false, message: "Access denied. No token provided." });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Fetch user from database
        const user = yield user_model_1.UserModel.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid token user." });
        }
        // Attach normalized user data to request
        const userId = ((_a = user._id) === null || _a === void 0 ? void 0 : _a.toString()) || decoded.id;
        req.user = {
            _id: userId, // User._id as string
            id: userId, // Alias
            role: decoded.role || user.role, // From token or fallback to user
            doctorId: decoded.doctorId || null, // Doctor._id if doctor, else null
        };
        next();
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.name) === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired." });
        }
        return res.status(401).json({ success: false, message: "Invalid token." });
    }
});
exports.authJwt = authJwt;
