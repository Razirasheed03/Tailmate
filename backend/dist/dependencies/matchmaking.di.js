"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchmakingController = void 0;
const matchmaking_controller_1 = require("../controllers/Implements/matchmaking.controller");
const matchmaking_service_1 = require("../services/implements/matchmaking.service");
const matchmaking_repository_1 = require("../repositories/implements/matchmaking.repository");
exports.matchmakingController = new matchmaking_controller_1.MatchmakingController(new matchmaking_service_1.MatchmakingService(new matchmaking_repository_1.MatchmakingRepository()));
