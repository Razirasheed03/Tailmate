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
exports.AuthController = void 0;
class AuthController {
    constructor(_authService) {
        this._authService = _authService;
        this.signup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this._authService.signup(req.body);
                res.status(201).json({ success: true, user });
            }
            catch (err) {
                console.log(err);
                next(err);
            }
        });
    }
}
exports.AuthController = AuthController;
