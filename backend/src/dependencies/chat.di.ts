import { ChatController } from "../controllers/Implements/chat.controller";
import { ChatService } from "../services/implements/chat.service";
import { ChatRepository } from "../repositories/implements/chat.repository";
import { MessageRepository } from "../repositories/implements/message.repository";
import { MatchmakingRepository } from "../repositories/implements/matchmaking.repository";

export const chatController = new ChatController(
  new ChatService(
    new ChatRepository(),
    new MessageRepository(),
    new MatchmakingRepository()
  )
);
