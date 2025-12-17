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
exports.DoctorService = void 0;
const roles_1 = require("../../constants/roles");
const doctorSlot_schema_1 = require("../../schema/doctorSlot.schema");
const mongoose_1 = require("mongoose");
const stripe_1 = require("../../utils/stripe");
const doctor_model_1 = require("../../models/implements/doctor.model");
const user_model_1 = require("../../models/implements/user.model");
class DoctorService {
    constructor(_userRepo, _doctorRepo) {
        this._userRepo = _userRepo;
        this._doctorRepo = _doctorRepo;
    }
    ensureDoctor(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this._userRepo.findById(userId);
            if (!user)
                throw new Error("User not found");
            if (user.role !== roles_1.UserRole.DOCTOR) {
                throw new Error("Only doctors can access this resource");
            }
        });
    }
    getVerification(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            yield this._doctorRepo.createIfMissing(userId);
            return this._doctorRepo.getVerification(userId);
        });
    }
    uploadCertificate(userId, certificateUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            if (!certificateUrl)
                throw new Error("certificateUrl is required");
            return this._doctorRepo.saveCertificateUrl(userId, certificateUrl);
        });
    }
    isProfileComplete(profile) {
        var _a, _b, _c;
        return !!(((_a = profile === null || profile === void 0 ? void 0 : profile.displayName) === null || _a === void 0 ? void 0 : _a.trim()) &&
            ((_b = profile === null || profile === void 0 ? void 0 : profile.bio) === null || _b === void 0 ? void 0 : _b.trim()) &&
            (profile === null || profile === void 0 ? void 0 : profile.specialties) &&
            profile.specialties.length > 0 &&
            typeof (profile === null || profile === void 0 ? void 0 : profile.experienceYears) === "number" &&
            ((_c = profile === null || profile === void 0 ? void 0 : profile.licenseNumber) === null || _c === void 0 ? void 0 : _c.trim()) &&
            typeof (profile === null || profile === void 0 ? void 0 : profile.consultationFee) === "number");
    }
    submitForReview(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            const doc = yield this._doctorRepo.getVerification(userId);
            if (!(doc === null || doc === void 0 ? void 0 : doc.certificateUrl)) {
                throw new Error("Please upload a certificate first");
            }
            const profile = yield this._doctorRepo.getProfile(userId).catch(() => ({}));
            if (!this.isProfileComplete(profile)) {
                throw new Error("Please complete all required profile fields (name, bio, specialties, experience, license, fee)");
            }
            return this._doctorRepo.submitForReview(userId);
        });
    }
    getProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            return this._doctorRepo.getProfile(userId);
        });
    }
    updateProfile(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            const profile = {};
            if (typeof payload.displayName === "string") {
                profile.displayName = payload.displayName.trim();
            }
            if (typeof payload.bio === "string") {
                const bio = payload.bio.trim();
                if (bio.length > 5000)
                    throw new Error("Bio is too long");
                profile.bio = bio;
            }
            if (Array.isArray(payload.specialties)) {
                profile.specialties = Array.from(new Set(payload.specialties.map((s) => String(s).trim()).filter(Boolean)));
            }
            if (typeof payload.experienceYears === "number") {
                if (payload.experienceYears < 0 || payload.experienceYears > 80) {
                    throw new Error("Experience out of range");
                }
                profile.experienceYears = payload.experienceYears;
            }
            if (typeof payload.licenseNumber === "string") {
                profile.licenseNumber = payload.licenseNumber.trim();
            }
            if (typeof payload.avatarUrl === "string") {
                profile.avatarUrl = payload.avatarUrl.trim();
            }
            if (typeof payload.consultationFee === "number") {
                if (payload.consultationFee < 0)
                    throw new Error("Fee cannot be negative");
                profile.consultationFee = payload.consultationFee;
            }
            return this._doctorRepo.updateProfile(userId, profile);
        });
    }
    // ===== Legacy per-day availability kept (unchanged) =====
    toMinutes(hhmm) {
        const [h, m] = hhmm.split(":").map(Number);
        return h * 60 + m;
    }
    overlaps(aStart, aDur, bStart, bDur) {
        const aEnd = aStart + aDur;
        const bEnd = bStart + bDur;
        return aStart < bEnd && aEnd > bStart;
    }
    ymd(d) {
        const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
    }
    within4Days(date) {
        const today = new Date();
        const min = this.ymd(today);
        const maxD = new Date(today);
        maxD.setDate(today.getDate() + 3);
        const max = this.ymd(maxD);
        return date >= min && date <= max;
    }
    listDaySlots(userId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            if (!this.within4Days(date))
                throw new Error("Date out of allowed range [today..+3]");
            return doctorSlot_schema_1.DoctorSlot.find({ userId: new mongoose_1.Types.ObjectId(userId), date }).lean().exec();
        });
    }
    saveDaySchedule(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            if (!this.within4Days(payload.date))
                throw new Error("Date out of allowed range [today..+3]");
            const uId = new mongoose_1.Types.ObjectId(userId);
            const sorted = [...payload.slots].sort((a, b) => a.time.localeCompare(b.time));
            for (let i = 0; i < sorted.length; i++) {
                for (let j = i + 1; j < sorted.length; j++) {
                    if (this.overlaps(this.toMinutes(sorted[i].time), sorted[i].durationMins, this.toMinutes(sorted[j].time), sorted[j].durationMins)) {
                        throw new Error(`Overlap between ${sorted[i].time} and ${sorted[j].time}`);
                    }
                }
            }
            yield doctorSlot_schema_1.DoctorSlot.deleteMany({ userId: uId, date: payload.date }).exec();
            const docs = sorted.map((s) => {
                var _a, _b, _c;
                return ({
                    userId: uId,
                    date: payload.date,
                    time: s.time,
                    durationMins: s.durationMins,
                    fee: (_a = s.fee) !== null && _a !== void 0 ? _a : 0,
                    modes: ((_b = s.modes) === null || _b === void 0 ? void 0 : _b.length) ? s.modes : ["video"],
                    status: (_c = s.status) !== null && _c !== void 0 ? _c : "available",
                });
            });
            if (docs.length)
                yield doctorSlot_schema_1.DoctorSlot.insertMany(docs, { ordered: true });
            return doctorSlot_schema_1.DoctorSlot.find({ userId: uId, date: payload.date }).lean().exec();
        });
    }
    createDaySlot(userId, slot) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            yield this.ensureDoctor(userId);
            if (!this.within4Days(slot.date))
                throw new Error("Date out of allowed range [today..+3]");
            const uId = new mongoose_1.Types.ObjectId(userId);
            const existing = yield doctorSlot_schema_1.DoctorSlot.find({ userId: uId, date: slot.date }).lean().exec();
            const start = this.toMinutes(slot.time);
            const conflict = existing.some((s) => this.overlaps(start, slot.durationMins, this.toMinutes(s.time), s.durationMins));
            if (conflict)
                throw new Error("Conflicts with an existing slot");
            const created = yield doctorSlot_schema_1.DoctorSlot.create({
                userId: uId,
                date: slot.date,
                time: slot.time,
                durationMins: slot.durationMins,
                fee: (_a = slot.fee) !== null && _a !== void 0 ? _a : 0,
                modes: ((_b = slot.modes) === null || _b === void 0 ? void 0 : _b.length) ? slot.modes : ["video"],
                status: (_c = slot.status) !== null && _c !== void 0 ? _c : "available",
            });
            return created.toObject();
        });
    }
    updateSlotStatus(userId, slotId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            return doctorSlot_schema_1.DoctorSlot.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(slotId), userId: new mongoose_1.Types.ObjectId(userId) }, { $set: { status } }, { new: true })
                .lean()
                .exec();
        });
    }
    deleteDaySlot(userId, slotId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            const r = yield doctorSlot_schema_1.DoctorSlot.deleteOne({
                _id: new mongoose_1.Types.ObjectId(slotId),
                userId: new mongoose_1.Types.ObjectId(userId),
            }).exec();
            return r.deletedCount === 1;
        });
    }
    // ===== Sessions (unchanged) =====
    listSessions(doctorId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            // Replace any with repository’s Paginated<Session> type
            yield this.ensureDoctor(doctorId);
            return this._doctorRepo.listSessions(doctorId, opts);
        });
    }
    getSession(doctorId, bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Replace any with concrete SessionDetail type
            yield this.ensureDoctor(doctorId);
            return this._doctorRepo.getSession(doctorId, bookingId);
        });
    }
    getWeeklyRules(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            const uId = new mongoose_1.Types.ObjectId(userId);
            const rows = yield DoctorService.WeeklyRuleModel.find({ userId: uId }).lean().exec();
            const byW = new Map();
            rows.forEach((r) => byW.set(r.weekday, r));
            const out = Array.from({ length: 7 }, (_, w) => {
                const r = byW.get(w);
                const fixtures = Array.isArray(r === null || r === void 0 ? void 0 : r.fixtures) && r.fixtures.length
                    ? r.fixtures.map((f) => ({
                        time: String(f.time),
                        fee: Number(f.fee) || 0,
                        modes: Array.isArray(f.modes) && f.modes.length ? f.modes : ["video"],
                    }))
                    : Array.isArray(r === null || r === void 0 ? void 0 : r.times) && r.times.length
                        ? r.times.map((t) => ({
                            time: String(t),
                            fee: Number(r === null || r === void 0 ? void 0 : r.fee) || 0,
                            modes: Array.isArray(r === null || r === void 0 ? void 0 : r.modes) && r.modes.length ? r.modes : ["video"],
                        }))
                        : [];
                return {
                    weekday: w,
                    enabled: !!(r === null || r === void 0 ? void 0 : r.enabled),
                    slotLengthMins: (r === null || r === void 0 ? void 0 : r.slotLengthMins) || 30,
                    fixtures,
                };
            });
            return out;
        });
    }
    saveWeeklyRules(userId, rules) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            const uId = new mongoose_1.Types.ObjectId(userId);
            const clean = (rules || []).filter((r) => r && r.weekday >= 0 && r.weekday <= 6);
            for (const r of clean) {
                const fixtures = Array.isArray(r.fixtures)
                    ? r.fixtures
                        .map((f) => ({
                        time: String(f.time),
                        fee: Number(f.fee) || 0,
                        modes: Array.isArray(f.modes) && f.modes.length ? f.modes : ["video"],
                    }))
                        .filter((f) => /^\d{2}:\d{2}$/.test(f.time))
                    : [];
                yield DoctorService.WeeklyRuleModel.updateOne({ userId: uId, weekday: r.weekday }, {
                    $set: {
                        enabled: !!r.enabled,
                        slotLengthMins: Number(r.slotLengthMins) || 30,
                        fixtures,
                        // Clear legacy fields when saving fixtures
                        times: [],
                        start: "",
                        end: "",
                        modes: ["video"],
                        fee: 0,
                    },
                }, { upsert: true }).exec();
            }
            return this.getWeeklyRules(userId);
        });
    }
    generateAvailability(userId, fromYMD, toYMD, rules) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureDoctor(userId);
            if (!fromYMD || !toYMD) {
                const err = new Error("from and to are required (YYYY-MM-DD)");
                err.status = 400;
                throw err;
            }
            const ruleList = Array.isArray(rules) && rules.length ? rules : yield this.getWeeklyRules(userId);
            const byW = new Map();
            ruleList.forEach((r) => byW.set(Number(r.weekday), r));
            const out = {};
            const startDate = new Date(`${fromYMD}T00:00:00Z`);
            const endDate = new Date(`${toYMD}T00:00:00Z`);
            for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
                const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
                const w = d.getUTCDay();
                const r = byW.get(w);
                out[ymd] = [];
                if (!r || !r.enabled)
                    continue;
                const duration = Number(r.slotLengthMins) || 30;
                if (Array.isArray(r.fixtures) && r.fixtures.length) {
                    const uniqTimes = new Set();
                    for (const f of r.fixtures) {
                        const t = String(f.time);
                        if (!/^\d{2}:\d{2}$/.test(t))
                            continue;
                        if (uniqTimes.has(t))
                            continue;
                        uniqTimes.add(t);
                        const fee = Number(f.fee) || 0;
                        const modes = Array.isArray(f.modes) && f.modes.length ? f.modes : ["video"];
                        out[ymd].push({ date: ymd, time: t, durationMins: duration, modes, fee });
                    }
                    out[ymd].sort((a, b) => a.time.localeCompare(b.time));
                }
            }
            return out;
        });
    }
    createStripeOnboarding(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doctor = yield doctor_model_1.DoctorModel.findOne({ userId });
            if (!doctor)
                throw new Error("Doctor not found");
            const user = yield user_model_1.UserModel.findById(userId);
            const doctorEmail = user === null || user === void 0 ? void 0 : user.email;
            if (!doctorEmail || !doctorEmail.includes("@"))
                throw new Error("Doctor email not found or invalid");
            if (doctor.stripeAccountId) {
                const acct = yield stripe_1.stripe.accounts.retrieve(doctor.stripeAccountId);
                // If account is incompletely onboarded or payouts not enabled
                if (!(acct && acct.payouts_enabled && acct.charges_enabled)) {
                    // Always generate an onboarding link for incomplete status
                    const accountLink = yield stripe_1.stripe.accountLinks.create({
                        account: doctor.stripeAccountId,
                        refresh_url: process.env.APP_URL + "/doctor/wallet?connect=refresh",
                        return_url: process.env.APP_URL + "/doctor/wallet?connect=return",
                        type: "account_onboarding",
                    });
                    return { url: accountLink.url, alreadyConnected: false };
                }
                // Onboarding finished
                return { url: null, alreadyConnected: true };
            }
            // No stripe account: create one and immediately offer onboarding
            const account = yield stripe_1.stripe.accounts.create({
                type: "express",
                country: "US",
                email: doctorEmail,
            });
            doctor.stripeAccountId = account.id;
            doctor.stripeOnboardingStatus = "pending";
            yield doctor.save();
            const accountLink = yield stripe_1.stripe.accountLinks.create({
                account: account.id,
                refresh_url: process.env.APP_URL + "/doctor/wallet?connect=refresh",
                return_url: process.env.APP_URL + "/doctor/wallet?connect=return",
                type: "account_onboarding",
            });
            return { url: accountLink.url, alreadyConnected: false };
        });
    }
    doctorDashboard(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const report = yield this._doctorRepo.doctorDashboard(doctorId);
            return report;
        });
    }
    getBookingStatusCounts(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._doctorRepo.getBookingStatusCounts(doctorId);
        });
    }
    getDashboardStats(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._doctorRepo.getDashboardStats(doctorId);
        });
    }
    getPetBookingTrends(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._doctorRepo.getDoctorBookingTrends(doctorId);
        });
    }
}
exports.DoctorService = DoctorService;
// ===== Weekly fixtures model =====
DoctorService.WeeklyRuleModel = (() => {
    const FixtureSchema = new mongoose_1.Schema({
        time: { type: String, required: true }, // "HH:mm"
        fee: { type: Number, min: 0, default: 0 },
        modes: { type: [String], enum: ["video", "audio", "inPerson"], default: ["video"] },
    }, { _id: false });
    const WeeklyRuleSchema = new mongoose_1.Schema({
        userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true, required: true },
        weekday: { type: Number, min: 0, max: 6, index: true, required: true },
        enabled: { type: Boolean, default: false },
        fixtures: { type: [FixtureSchema], default: [] }, // NEW per-time fixtures
        slotLengthMins: { type: Number, min: 5, max: 120, default: 30 },
        // Back-compat legacy fields (ignored if fixtures present)
        times: { type: [String], default: [] },
        start: { type: String, default: "" },
        end: { type: String, default: "" },
        modes: { type: [String], enum: ["video", "audio", "inPerson"], default: ["video"] },
        fee: { type: Number, min: 0, default: 0 },
    }, { timestamps: true });
    WeeklyRuleSchema.index({ userId: 1, weekday: 1 }, { unique: true });
    return (0, mongoose_1.model)("DoctorWeeklyRule", WeeklyRuleSchema);
})();
