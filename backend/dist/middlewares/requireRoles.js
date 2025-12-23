"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        if (!roles.includes(user.role)) {
            res.status(403).json({ message: "Forbidden: Insufficient role" });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
