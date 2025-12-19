import { MatchmakingController } from "../controllers/Implements/matchmaking.controller";
import { MatchmakingService } from "../services/implements/matchmaking.service";
import { MatchmakingRepository } from "../repositories/implements/matchmaking.repository";

export const matchmakingController = new MatchmakingController(
  new MatchmakingService(new MatchmakingRepository())
);
