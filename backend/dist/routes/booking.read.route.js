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
// backend/src/routes/booking.read.route.ts
const express_1 = require("express");
const booking_schema_1 = require("../schema/booking.schema");
const router = (0, express_1.Router)();
// GET /api/bookings/:id
router.get("/bookings/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doc = yield booking_schema_1.Booking.findById(req.params.id)
            .select("_id status amount currency doctorId patientId createdAt")
            .lean();
        if (!doc)
            return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, data: doc });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
