"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBookingNumber = generateBookingNumber;
function generateBookingNumber(lastNumber) {
    const prefix = "BK";
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const datePart = `${day}${month}${year}`;
    const serial = String(lastNumber + 1).padStart(3, "0");
    return `${prefix}-${datePart}-${serial}`;
}
