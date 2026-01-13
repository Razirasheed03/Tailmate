"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFrontendUrl = void 0;
function validateUrl(url, name) {
    if (!url) {
        throw new Error(`${name} is required`);
    }
    const isLocalhost = url.startsWith("http://localhost") ||
        url.startsWith("http://127.0.0.1");
    if (!isLocalhost && !url.startsWith("https://")) {
        throw new Error(`${name} must start with https:// (except localhost)`);
    }
    return url.replace(/\/$/, "");
}
const getFrontendUrl = () => {
    const rawUrl = process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : process.env.FRONTEND_URL || "http://localhost:3000";
    if (!rawUrl) {
        throw new Error("FRONTEND_URL is required");
    }
    return validateUrl(rawUrl, "FRONTEND_URL");
};
exports.getFrontendUrl = getFrontendUrl;
