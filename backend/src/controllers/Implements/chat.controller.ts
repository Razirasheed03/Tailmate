import { Request, Response, NextFunction } from "express";
import { ChatService } from "../../services/implements/chat.service";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";

const svc = new ChatService();

export class ChatController {
  startChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      if (!userId)
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const { listingId, receiverId } = req.body;

      if (!listingId || !receiverId) {
        return ResponseHelper.badRequest(
          res,
          "listingId and receiverId are required"
        );
      }

      const room = await svc.startChat(userId, listingId, receiverId);
      return ResponseHelper.ok(res, room, "Chat room created or retrieved");
    } catch (err) {
      next(err);
    }
  };

  listRooms = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      if (!userId)
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const rooms = await svc.listRooms(userId);
      return ResponseHelper.ok(res, rooms, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

  listMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      if (!userId)
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const roomId = req.params.roomId;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      if (!roomId) {
        return ResponseHelper.badRequest(res, "roomId is required");
      }

      const result = await svc.listMessages(userId, roomId, page, limit);
      return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      if (!userId)
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const { roomId, content } = req.body;

      if (!roomId || !content) {
        return ResponseHelper.badRequest(
          res,
          "roomId and content are required"
        );
      }

      const message = await svc.sendMessage(userId, roomId, content);
      return ResponseHelper.created(res, message, "Message sent");
    } catch (err) {
      next(err);
    }
  };

  markDelivered = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      if (!userId)
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const roomId = req.params.roomId;

      if (!roomId) {
        return ResponseHelper.badRequest(res, "roomId is required");
      }

      const result = await svc.markDelivered(userId, roomId);
      return ResponseHelper.ok(res, result, "Messages marked as delivered");
    } catch (err) {
      next(err);
    }
  };

  markSeen = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      if (!userId)
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const roomId = req.params.roomId;

      if (!roomId) {
        return ResponseHelper.badRequest(res, "roomId is required");
      }

      const result = await svc.markSeen(userId, roomId);
      return ResponseHelper.ok(res, result, "Messages marked as seen");
    } catch (err) {
      next(err);
    }
  };
}
