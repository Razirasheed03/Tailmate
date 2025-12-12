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
// src/routes/marketplace.routes.ts
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authJwt_1 = require("../middlewares/authJwt");
const asyncHandler_1 = require("../utils/asyncHandler");
const marketplace_controller_1 = require("../controllers/Implements/marketplace.controller");
const uploadToCloudinary_1 = require("../utils/uploadToCloudinary");
const marketOrder_schema_1 = require("../schema/marketOrder.schema");
const router = (0, express_1.Router)();
const c = new marketplace_controller_1.MarketplaceController();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});
router.use(authJwt_1.authJwt);
router.get('/listings', (0, asyncHandler_1.asyncHandler)(c.listPublic));
router.get('/listings/mine', (0, asyncHandler_1.asyncHandler)(c.listMine));
router.put('/listings/:id', (0, asyncHandler_1.asyncHandler)(c.update));
router.patch('/listings/:id', (0, asyncHandler_1.asyncHandler)(c.update));
router.patch('/listings/:id/status', (0, asyncHandler_1.asyncHandler)(c.changeStatus));
router.patch('/listings/:id/complete', (0, asyncHandler_1.asyncHandler)(c.markComplete));
router.post('/listings/:id/status', (0, asyncHandler_1.asyncHandler)(c.changeStatus));
router.post('/listings', (0, asyncHandler_1.asyncHandler)(c.create));
router.delete('/listings/:id', (0, asyncHandler_1.asyncHandler)(c.remove));
router.post('/listings/photo', upload.single('file'), (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file' });
    }
    const filename = req.file.originalname || `listing-${Date.now()}.jpg`;
    const { secure_url } = yield (0, uploadToCloudinary_1.uploadMarketplaceImageBufferToCloudinary)(req.file.buffer, filename);
    return res.json({ success: true, url: secure_url });
})));
router.get('/orders/:id', (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield marketOrder_schema_1.MarketOrder.findById(req.params.id).lean();
    if (!row)
        return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
})));
router.get('/listings/:id', (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield (require('../schema/marketplaceListing.schema').MarketplaceListing)
        .findById(req.params.id).lean();
    if (!row)
        return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
})));
exports.default = router;
