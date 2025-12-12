"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    roomId: {
        type: mongoose_1.Types.ObjectId,
        ref: "ChatRoom",
        required: true,
        index: true,
    },
    senderId: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    content: { type: String, required: true, trim: true },
    type: { type: String, enum: ["text"], default: "text" },
    deliveredTo: {
        type: [mongoose_1.Types.ObjectId],
        ref: "User",
        default: [],
    },
    seenBy: {
        type: [mongoose_1.Types.ObjectId],
        ref: "User",
        default: [],
    },
}, { timestamps: true });
exports.Message = (0, mongoose_1.model)("Message", MessageSchema);
