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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = exports.UploadController = void 0;
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
const uploadToCloudinary_1 = require("../../utils/uploadToCloudinary");
class UploadController {
    constructor() {
        this.uploadChat = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const file = req.file;
                if (!file) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "file is required");
                }
                const uploaded = yield (0, uploadToCloudinary_1.uploadChatBufferToCloudinary)(file.buffer, file.originalname);
                return ResponseHelper_1.ResponseHelper.created(res, {
                    url: uploaded.secure_url,
                    name: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                }, "Upload successful");
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.UploadController = UploadController;
exports.uploadController = new UploadController();
