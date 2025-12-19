"use strict";
// repositories/implements/payment.repository.ts
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
exports.PaymentRepository = void 0;
const payment_model_1 = require("../../models/implements/payment.model");
class PaymentRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield payment_model_1.PaymentModel.create(data);
        });
    }
    update(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield payment_model_1.PaymentModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
        });
    }
    byDoctorPaginated(doctorId_1) {
        return __awaiter(this, arguments, void 0, function* (doctorId, params = {}) {
            const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = params;
            const currentPage = Math.max(1, page);
            const perPage = Math.min(Math.max(1, limit), 100);
            const skip = (currentPage - 1) * perPage;
            const sortOrder = order === 'asc' ? 1 : -1;
            const sortObj = { [sortBy]: sortOrder };
            const totalItems = yield payment_model_1.PaymentModel.countDocuments({ doctorId });
            const totalPages = Math.ceil(totalItems / perPage);
            const data = yield payment_model_1.PaymentModel.find({ doctorId })
                .sort(sortObj)
                .skip(skip)
                .limit(perPage)
                .lean();
            return {
                data,
                pagination: {
                    currentPage,
                    totalPages,
                    totalItems,
                    perPage,
                    hasNext: currentPage < totalPages,
                    hasPrev: currentPage > 1
                }
            };
        });
    }
    byDoctor(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield payment_model_1.PaymentModel.find({ doctorId })
                .sort({ createdAt: -1 })
                .lean();
        });
    }
}
exports.PaymentRepository = PaymentRepository;
