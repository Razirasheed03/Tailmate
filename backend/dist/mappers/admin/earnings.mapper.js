"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EarningsMapper = void 0;
class EarningsMapper {
    static toDoctorEarningsDTO(aggregateResult) {
        var _a, _b, _c, _d;
        return {
            doctorId: ((_a = aggregateResult._id) === null || _a === void 0 ? void 0 : _a.toString()) || "",
            doctorName: ((_b = aggregateResult.doctor) === null || _b === void 0 ? void 0 : _b.username) || ((_c = aggregateResult.doctor) === null || _c === void 0 ? void 0 : _c.displayName) || "Unknown",
            doctorEmail: ((_d = aggregateResult.doctor) === null || _d === void 0 ? void 0 : _d.email) || "",
            totalEarnings: aggregateResult.totalEarnings || 0,
        };
    }
    static toEarningsResponseDTO(results) {
        const earnings = results.map((result) => this.toDoctorEarningsDTO(result));
        const totalEarnings = earnings.reduce((sum, d) => { var _a; return sum + ((_a = d.totalEarnings) !== null && _a !== void 0 ? _a : 0); }, 0);
        return { totalEarnings, earnings };
    }
}
exports.EarningsMapper = EarningsMapper;
