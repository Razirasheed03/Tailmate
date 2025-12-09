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
exports.UserRepository = void 0;
// src/repositories/implements/UserRepository.ts
const baseRepository_1 = require("../baseRepository");
const user_model_1 = require("../../models/implements/user.model");
const roles_1 = require("../../constants/roles");
class UserRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super(user_model_1.UserModel);
    }
    createUser(user) {
        const _super = Object.create(null, {
            create: { get: () => super.create }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return yield _super.create.call(this, user);
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findOne({ email });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findById(id);
        });
    }
    getAllUsers() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, search = "") {
            const skip = (page - 1) * limit;
            const searchQuery = search
                ? {
                    $or: [
                        { username: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } }
                    ]
                }
                : {};
            const users = yield user_model_1.UserModel
                .find(searchQuery)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            const total = yield user_model_1.UserModel.countDocuments(searchQuery);
            const totalPages = Math.ceil(total / limit);
            return {
                users: users,
                total,
                page,
                totalPages
            };
        });
    }
    updateUserBlockStatus(userId, isBlocked) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.UserModel.findByIdAndUpdate(userId, { isBlocked }, { new: true }).select("-password");
            if (!user) {
                throw new Error("User not found");
            }
            return user.toObject();
        });
    }
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield user_model_1.UserModel.findByIdAndDelete(userId);
            if (!result) {
                throw new Error("User not found");
            }
        });
    }
    getUserStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const [totalUsers, totalDoctors, totalPatients, blockedUsers] = yield Promise.all([
                user_model_1.UserModel.countDocuments({}),
                user_model_1.UserModel.countDocuments({ role: roles_1.UserRole.DOCTOR }),
                user_model_1.UserModel.countDocuments({ role: roles_1.UserRole.USER }),
                user_model_1.UserModel.countDocuments({ isBlocked: true })
            ]);
            return {
                totalUsers,
                totalDoctors,
                totalPatients,
                blockedUsers
            };
        });
    }
    updateUsername(userId, username) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield this.model
                .findByIdAndUpdate(userId, { $set: { username } }, { new: true, runValidators: true, context: "query" })
                .select("-password");
            return updated ? updated.toObject() : null;
        });
    }
}
exports.UserRepository = UserRepository;
