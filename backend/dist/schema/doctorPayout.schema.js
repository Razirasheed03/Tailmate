"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorPayoutModel = void 0;
const mongoose_1 = require("mongoose");
const doctorPayoutSchema = new mongoose_1.Schema({
    doctorId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "Doctor" },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
});
exports.DoctorPayoutModel = (0, mongoose_1.model)("DoctorPayout", doctorPayoutSchema);
