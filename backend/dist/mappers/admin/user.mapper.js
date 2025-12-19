"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
class UserMapper {
    static toUserListItemDTO(user) {
        var _a;
        return {
            id: ((_a = user._id) === null || _a === void 0 ? void 0 : _a.toString()) || "",
            username: user.username || "",
            email: user.email || "",
            role: user.role || "",
            isBlocked: user.isBlocked || false,
            createdAt: user.createdAt || new Date(),
        };
    }
    static toUserListResponseDTO(users, total, page, totalPages) {
        return {
            users: users.map((user) => this.toUserListItemDTO(user)),
            total,
            page,
            totalPages,
        };
    }
    static toUserStatsDTO(stats) {
        return {
            totalUsers: stats.totalUsers,
            totalDoctors: stats.totalDoctors,
            blockedUsers: stats.blockedUsers,
        };
    }
}
exports.UserMapper = UserMapper;
