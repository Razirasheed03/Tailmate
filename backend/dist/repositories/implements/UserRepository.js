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
exports.UserRepository = void 0;
const baseRepo_1 = require("../baseRepo");
const UserModel_1 = require("../../models/implements/UserModel");
class UserRepository extends baseRepo_1.BaseRepository {
    constructor() {
        super(UserModel_1.UserModel);
    }
    createUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.create(user); // ✅ force cast
        });
    }
    findByEmail(email) {
        const _super = Object.create(null, {
            findByEmail: { get: () => super.findByEmail }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return yield _super.findByEmail.call(this, email);
        });
    }
}
exports.UserRepository = UserRepository;
