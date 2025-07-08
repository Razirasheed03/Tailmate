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
class AuthService {
    constructor(_userRepo) {
        this._userRepo = _userRepo;
        this.signup = (user) => __awaiter(this, void 0, void 0, function* () {
            console.log('🔍 AuthService.signup called with:', Object.assign(Object.assign({}, user), { password: '[HIDDEN]' }));
            try {
                // Check if user already exists
                const existing = yield this._userRepo.findByEmail(user.email);
                if (existing) {
                    console.log('❌ User already exists with email:', user.email);
                    throw new Error("User already exists");
                }
                // Hash password
                console.log('🔍 Hashing password...');
                const hashedPassword = yield bcryptjs_1.default.hash(user.password, 10);
                console.log('✅ Password hashed successfully');
                // Create user
                const userToCreate = Object.assign(Object.assign({}, user), { password: hashedPassword });
                console.log('🔍 Creating user with hashed password...');
                const createdUser = yield this._userRepo.createUser(userToCreate);
                console.log('✅ User created successfully:', Object.assign(Object.assign({}, createdUser), { password: '[HIDDEN]' }));
                return createdUser;
            }
            catch (error) {
                console.error('❌ Error in AuthService.signup:', error);
                throw error;
            }
        });
    }
}
exports.AuthService = AuthService;
