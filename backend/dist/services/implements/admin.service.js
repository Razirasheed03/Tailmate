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
exports.AdminService = void 0;
const payment_model_1 = require("../../models/implements/payment.model");
const mappers_1 = require("../../mappers");
class AdminService {
    constructor(_userRepo, _adminRepo) {
        this._userRepo = _userRepo;
        this._adminRepo = _adminRepo;
    }
    getAllUsers() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, search = "") {
            const result = yield this._userRepo.getAllUsers(page, limit, search);
            return mappers_1.UserMapper.toUserListResponseDTO(result.users, result.total, result.page, result.totalPages);
        });
    }
    blockUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._userRepo.updateUserBlockStatus(userId, true);
            return { message: "User blocked successfully" };
        });
    }
    unblockUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._userRepo.updateUserBlockStatus(userId, false);
            return { message: "User unblocked successfully" };
        });
    }
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._userRepo.deleteUser(userId);
            return { message: "User deleted successfully" };
        });
    }
    getUserStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield this._userRepo.getUserStats();
            return mappers_1.UserMapper.toUserStatsDTO(stats);
        });
    }
    listDoctors() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, status = "", search = "") {
            const safePage = Math.max(1, Number(page) || 1);
            const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
            const result = yield this._adminRepo.listDoctors({
                page: safePage,
                limit: safeLimit,
                status,
                search: search.trim(),
            });
            return mappers_1.DoctorMapper.toDoctorListResponseDTO(result.data, result.page, result.totalPages, result.total);
        });
    }
    verifyDoctor(userId, reviewerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!userId)
                throw new Error("userId required");
            if (!reviewerId)
                throw new Error("reviewerId required");
            const updated = yield this._adminRepo.verifyDoctor(userId, reviewerId);
            return mappers_1.DoctorMapper.toDoctorVerifyResponseDTO({
                status: (_a = updated.verification) === null || _a === void 0 ? void 0 : _a.status,
                verifiedAt: (_b = updated.verification) === null || _b === void 0 ? void 0 : _b.verifiedAt,
            });
        });
    }
    rejectDoctor(userId, reviewerId, reasons) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!userId)
                throw new Error("userId required");
            if (!reviewerId)
                throw new Error("reviewerId required");
            if (!Array.isArray(reasons) || reasons.length === 0)
                throw new Error("At least one reason is required");
            const updated = yield this._adminRepo.rejectDoctor(userId, reviewerId, reasons);
            return mappers_1.DoctorMapper.toDoctorRejectResponseDTO({
                status: (_a = updated.verification) === null || _a === void 0 ? void 0 : _a.status,
                rejectionReasons: (_b = updated.verification) === null || _b === void 0 ? void 0 : _b.rejectionReasons,
            });
        });
    }
    getDoctorDetail(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId)
                throw new Error("userId required");
            const doctor = yield this._adminRepo.getDoctorDetail(userId);
            return mappers_1.DoctorMapper.toDoctorDetailDTO(doctor);
        });
    }
    listPetCategories(page, limit, search, active) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._adminRepo.listPetCategories({
                page,
                limit,
                search,
                active,
            });
            return mappers_1.PetCategoryMapper.toPetCategoryListResponseDTO(result.data, result.page, result.totalPages, result.total);
        });
    }
    createPetCategory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(payload === null || payload === void 0 ? void 0 : payload.name) || !payload.name.trim())
                throw new Error("name is required");
            const created = yield this._adminRepo.createPetCategory(mappers_1.PetCategoryMapper.toCreatePayload(payload));
            return mappers_1.PetCategoryMapper.toPetCategoryDTO(created);
        });
    }
    updatePetCategory(id, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield this._adminRepo.updatePetCategory(id, mappers_1.PetCategoryMapper.toUpdatePayload(payload));
            return updated ? mappers_1.PetCategoryMapper.toPetCategoryDTO(updated) : null;
        });
    }
    deletePetCategory(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._adminRepo.deletePetCategory(id);
        });
    }
    getEarningsByDoctor() {
        return __awaiter(this, void 0, void 0, function* () {
            const pipeline = [
                { $match: { paymentStatus: "success" } },
                {
                    $group: {
                        _id: "$doctorId",
                        totalEarnings: { $sum: "$platformFee" },
                        count: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "doctor",
                    },
                },
                { $unwind: "$doctor" },
            ];
            const results = yield payment_model_1.PaymentModel.aggregate(pipeline);
            return mappers_1.EarningsMapper.toEarningsResponseDTO(results);
        });
    }
    getBookingStatusChart() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this._adminRepo.getBookingStatusCounts();
            return data;
        });
    }
    getFilteredEarnings(start, end, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._adminRepo.getFilteredEarnings(start, end, doctorId);
        });
    }
    getSimpleDoctorList() {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = yield this._adminRepo.getSimpleDoctorList();
            return docs.map((doc) => ({
                _id: doc._id.toString(),
                username: doc.username,
                email: doc.email,
                count: doc.count
            }));
        });
    }
    getGrowthStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const counts = yield this._adminRepo.getGrowthStats();
            const calcPercent = (current, previous) => {
                if (previous === 0) {
                    if (current === 0)
                        return 0;
                    return 100; // or null if you prefer "∞"
                }
                return ((current - previous) / previous) * 100;
            };
            return {
                users: {
                    current: counts.users.current,
                    previous: counts.users.previous,
                    percent: calcPercent(counts.users.current, counts.users.previous),
                },
                doctors: {
                    current: counts.doctors.current,
                    previous: counts.doctors.previous,
                    percent: calcPercent(counts.doctors.current, counts.doctors.previous),
                },
                bookings: {
                    current: counts.bookings.current,
                    previous: counts.bookings.previous,
                    percent: calcPercent(counts.bookings.current, counts.bookings.previous),
                },
            };
        });
    }
}
exports.AdminService = AdminService;
