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
exports.requireAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/implements/user.model");
const roles_1 = require("../constants/roles");
const requireAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
            res.status(401).json({ success: false, message: "Access denied. No token provided." });
            return;
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield user_model_1.UserModel.findById(decoded.id);
        if (!user || user.role !== roles_1.UserRole.ADMIN) {
            res.status(403).json({ success: false, message: "Access denied. Admin only." });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.name) === "TokenExpiredError") {
            res.status(401).json({ success: false, message: "Token expired." });
            return;
        }
        res.status(401).json({ success: false, message: "Invalid token." });
    }
});
exports.requireAdmin = requireAdmin;
