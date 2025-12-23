"use strict";
// repositories/implements/doctorPublic.repository.ts
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
exports.DoctorPublicRepository = void 0;
const mongoose_1 = require("mongoose");
const doctor_schema_1 = require("../../schema/doctor.schema");
const doctorSlot_schema_1 = require("../../schema/doctorSlot.schema");
const booking_schema_1 = require("../../schema/booking.schema");
function isUIMode(x) {
    return x === "video" || x === "audio" || x === "inPerson";
}
function toUIModes(input) {
    if (!Array.isArray(input))
        return ["video"];
    const narrowed = input.filter(isUIMode);
    return narrowed.length ? narrowed : ["video"];
}
function ymdUTC(d) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function hmUTC(d) {
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
const WeeklyRuleSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    weekday: { type: Number, min: 0, max: 6, index: true, required: true },
    enabled: { type: Boolean, default: false },
    slotLengthMins: { type: Number, min: 5, max: 120, default: 30 },
    fixtures: { type: [{ time: String, fee: Number, modes: [String] }], default: [] },
    times: { type: [String], default: [] },
    start: { type: String, default: "" },
    end: { type: String, default: "" },
    modes: { type: [String], default: ["video"] },
    fee: { type: Number, default: 0 },
}, { collection: "doctorweeklyrules" });
const DoctorWeeklyRule = (0, mongoose_1.model)("DoctorWeeklyRule_Public", WeeklyRuleSchema);
class DoctorPublicRepository {
    listVerifiedWithNextSlot(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = Math.max(1, Number(params.page) || 1);
            const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
            const search = (params.search || "").trim();
            const specialty = (params.specialty || "").trim();
            const matchDoctor = {
                $match: Object.assign(Object.assign({ "verification.status": "verified" }, (search
                    ? {
                        $or: [
                            { "profile.displayName": { $regex: search, $options: "i" } },
                            { "profile.bio": { $regex: search, $options: "i" } },
                        ],
                    }
                    : {})), (specialty ? { "profile.specialties": specialty } : {})),
            };
            const pipeline = [
                matchDoctor,
                {
                    $project: {
                        userId: 1,
                        doctorId: "$userId",
                        displayName: "$profile.displayName",
                        avatarUrl: "$profile.avatarUrl",
                        experienceYears: "$profile.experienceYears",
                        specialties: "$profile.specialties",
                        consultationFee: "$profile.consultationFee",
                    },
                },
                { $sort: { displayName: 1 } },
                {
                    $facet: {
                        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                        total: [{ $count: "count" }],
                    },
                },
                {
                    $project: {
                        items: 1,
                        total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
                    },
                },
            ];
            const [result] = yield doctor_schema_1.Doctor.aggregate(pipeline).exec();
            const items = ((result === null || result === void 0 ? void 0 : result.items) || []);
            const total = (result === null || result === void 0 ? void 0 : result.total) || 0;
            if (!items.length) {
                return { items: [], total, page, limit };
            }
            const ids = items.map((d) => d.userId);
            const rules = yield DoctorWeeklyRule.find({ userId: { $in: ids } })
                .lean()
                .exec();
            const byUid = new Map();
            for (const r of rules) {
                const k = String(r.userId);
                const arr = byUid.get(k) || [];
                arr.push(r);
                byUid.set(k, arr);
            }
            const today = new Date();
            const horizonDays = 14;
            function ymd(d) {
                return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
            }
            const enriched = yield Promise.all(items.map((doc) => __awaiter(this, void 0, void 0, function* () {
                const uid = String(doc.userId);
                const rulesFor = byUid.get(uid) || [];
                const byW = new Map();
                rulesFor.forEach((r) => byW.set(r.weekday, r));
                let nextSlot = null;
                let modesUnion = new Set();
                for (const r of rulesFor) {
                    if (!(r === null || r === void 0 ? void 0 : r.enabled))
                        continue;
                    if (Array.isArray(r.fixtures)) {
                        for (const f of r.fixtures) {
                            toUIModes(f.modes).forEach((m) => modesUnion.add(m));
                        }
                    }
                }
                for (let i = 0; i <= horizonDays && !nextSlot; i++) {
                    const d = new Date(today);
                    d.setUTCDate(today.getUTCDate() + i);
                    const dateStr = ymd(d);
                    const w = d.getUTCDay();
                    const rule = byW.get(w);
                    if (!rule ||
                        !rule.enabled ||
                        !Array.isArray(rule.fixtures) ||
                        !rule.fixtures.length)
                        continue;
                    const times = Array.from(new Set(rule.fixtures
                        .map((f) => String(f.time))
                        .filter((t) => /^\d{2}:\d{2}$/.test(t)))).sort((a, b) => a.localeCompare(b));
                    if (times.length) {
                        nextSlot = { date: dateStr, time: times[0] };
                    }
                }
                if (!nextSlot) {
                    const now = new Date();
                    const todayYmd = ymdUTC(now);
                    const nowHM = hmUTC(now);
                    const first = yield doctorSlot_schema_1.DoctorSlot.findOne({
                        userId: doc.userId,
                        status: "available",
                        $or: [
                            { date: { $gt: todayYmd } },
                            { date: todayYmd, time: { $gte: nowHM } },
                        ],
                    })
                        .sort({ date: 1, time: 1 })
                        .lean()
                        .exec();
                    if (first) {
                        nextSlot = { date: first.date, time: first.time };
                        toUIModes(first.modes).forEach((m) => modesUnion.add(m));
                    }
                }
                return {
                    doctorId: doc.doctorId,
                    displayName: doc.displayName,
                    avatarUrl: doc.avatarUrl,
                    experienceYears: doc.experienceYears,
                    specialties: doc.specialties,
                    consultationFee: doc.consultationFee,
                    nextSlot: nextSlot || undefined,
                    modes: Array.from(modesUnion),
                };
            })));
            return { items: enriched, total, page, limit };
        });
    }
    getDoctorPublicById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(id))
                return null;
            const pipeline = [
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(id),
                        "verification.status": "verified",
                    },
                },
                {
                    $project: {
                        doctorId: "$userId",
                        displayName: "$profile.displayName",
                        avatarUrl: "$profile.avatarUrl",
                        experienceYears: "$profile.experienceYears",
                        specialties: "$profile.specialties",
                        consultationFee: "$profile.consultationFee",
                        bio: "$profile.bio",
                        languages: "$profile.languages",
                        location: "$profile.location",
                    },
                },
                { $limit: 1 },
            ];
            const [doc] = yield doctor_schema_1.Doctor.aggregate(pipeline).exec();
            if (!doc)
                return null;
            const rules = yield DoctorWeeklyRule.find({
                userId: new mongoose_1.Types.ObjectId(id),
            })
                .lean()
                .exec();
            const modesUnion = new Set();
            for (const r of rules) {
                if (!(r === null || r === void 0 ? void 0 : r.enabled))
                    continue;
                if (Array.isArray(r.fixtures)) {
                    for (const f of r.fixtures) {
                        toUIModes(f.modes).forEach((m) => modesUnion.add(m));
                    }
                }
            }
            return Object.assign(Object.assign({}, doc), { modes: Array.from(modesUnion) });
        });
    }
    listGeneratedAvailability(id, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(id))
                return [];
            const userId = new mongoose_1.Types.ObjectId(id);
            const rules = yield DoctorWeeklyRule.find({ userId }).lean().exec();
            const byW = new Map();
            rules.forEach((r) => byW.set(r.weekday, r));
            const out = [];
            const startDate = new Date(`${opts.from}T00:00:00Z`);
            const endDate = new Date(`${opts.to}T00:00:00Z`);
            for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
                const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
                const w = d.getUTCDay();
                const r = byW.get(w);
                if (!r || !r.enabled)
                    continue;
                const duration = Number(r.slotLengthMins) || 30;
                if (Array.isArray(r.fixtures) && r.fixtures.length) {
                    const seen = new Set();
                    for (const f of r.fixtures) {
                        const t = String(f.time);
                        if (!/^\d{2}:\d{2}$/.test(t))
                            continue;
                        if (seen.has(t))
                            continue;
                        seen.add(t);
                        const fee = Number(f.fee) || 0;
                        const modes = toUIModes(f.modes);
                        out.push({
                            _id: `${id}:${ymd}:${t}`,
                            date: ymd,
                            time: t,
                            durationMins: duration,
                            fee,
                            modes,
                            status: "available",
                        });
                    }
                }
            }
            if (out.length === 0) {
                const rows = yield doctorSlot_schema_1.DoctorSlot.find({
                    userId,
                    date: { $gte: opts.from, $lte: opts.to },
                    status: "available",
                })
                    .sort({ date: 1, time: 1 })
                    .lean()
                    .exec();
                return rows.map((s) => {
                    var _a;
                    return ({
                        _id: String(s._id),
                        date: s.date,
                        time: s.time,
                        durationMins: s.durationMins,
                        fee: (_a = s.fee) !== null && _a !== void 0 ? _a : 0,
                        modes: toUIModes(s.modes),
                        status: "available",
                    });
                });
            }
            const booked = yield booking_schema_1.Booking.find({
                doctorId: userId,
                date: { $gte: opts.from, $lte: opts.to },
                status: { $in: ["pending", "paid"] },
            })
                .select({ date: 1, time: 1 })
                .lean()
                .exec();
            const taken = new Set(booked.map((b) => `${b.date}|${b.time}`));
            const filtered = out.filter((s) => !taken.has(`${s.date}|${s.time}`));
            filtered.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
            return filtered;
        });
    }
}
exports.DoctorPublicRepository = DoctorPublicRepository;
