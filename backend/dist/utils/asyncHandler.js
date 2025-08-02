"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
// Utility for catching errors in async/await handlers and forwarding to Express
function asyncHandler(fn) {
    return (req, res, next) => {
        // No return needed!
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
