"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoom = void 0;
const mongoose_1 = require("mongoose");
const ChatRoomSchema = new mongoose_1.Schema({
    listingId: {
        type: mongoose_1.Types.ObjectId,
        ref: "MatchmakingListing",
        required: true,
        index: true,
    },
    users: {
        type: [mongoose_1.Types.ObjectId],
        ref: "User",
        required: true,
        validate: {
            validator: function (v) {
                return Array.isArray(v) && v.length === 2;
            },
            message: "Must have exactly 2 users",
        },
        index: true,
    },
    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
}, { timestamps: true });
// Compound index for unique room per listing + users
ChatRoomSchema.index({ listingId: 1, users: 1 }, { unique: true });
exports.ChatRoom = (0, mongoose_1.model)("ChatRoom", ChatRoomSchema);
