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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authJwt_1 = require("../middlewares/authJwt");
const asyncHandler_1 = require("../utils/asyncHandler");
const matchmaking_di_1 = require("../dependencies/matchmaking.di");
const uploadToCloudinary_1 = require("../utils/uploadToCloudinary");
const router = (0, express_1.Router)();
const c = matchmaking_di_1.matchmakingController;
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
});
router.use(authJwt_1.authJwt);
router.get("/list", (0, asyncHandler_1.asyncHandler)(c.listPublic));
router.get("/mine", (0, asyncHandler_1.asyncHandler)(c.listMine));
router.post("/", (0, asyncHandler_1.asyncHandler)(c.create));
router.put("/:id", (0, asyncHandler_1.asyncHandler)(c.update));
router.patch("/:id/status", (0, asyncHandler_1.asyncHandler)(c.changeStatus));
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(c.remove));
router.post("/photo", upload.single("file"), (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file)
        return res.status(400).json({ success: false, message: "No file" });
    const filename = req.file.originalname || `match-${Date.now()}.jpg`;
    const { secure_url } = yield (0, uploadToCloudinary_1.uploadMarketplaceImageBufferToCloudinary)(req.file.buffer, filename);
    res.json({ success: true, url: secure_url });
})));
exports.default = router;
