"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFrontendUrl = void 0;
function validateUrl(url, name) {
    if (!url) {
        throw new Error(`${name} is required`);
    }
    if (!url.startsWith("https://")) {
        throw new Error(`${name} must start with https://`);
    }
    return url.replace(/\/$/, ""); // remove trailing slash
}
const getFrontendUrl = () => {
    return validateUrl(process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || "", "FRONTEND_URL");
};
exports.getFrontendUrl = getFrontendUrl;
