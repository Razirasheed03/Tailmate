import { Request, Response, NextFunction } from "express";
import { MatchmakingService } from "../../services/implements/matchmaking.service";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";
import { IMatchmakingService } from "../../services/interfaces/matchmaking.service.interface";

// const this.IMatchmakingService = new MatchmakingService();

export class MatchmakingController {
  constructor(private readonly matchmakingService: IMatchmakingService) {}
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const userId = (req as any).user?._id?.toString();
      const userId = req.user?._id?.toString();
      if (!userId)
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const listing = await this.matchmakingService.create(userId, req.body || {});
      return ResponseHelper.created(res, listing, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

listPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const q = (req.query.q as string) || "";
    const place = (req.query.place as string) || "";
    const sortBy = (req.query.sortBy as string) || "newest";

    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lng = req.query.lng ? Number(req.query.lng) : undefined;
    const radius = req.query.radius ? Number(req.query.radius) : undefined;

    const result = await this.matchmakingService.listPublic(
      page,
      limit,
      q,
      place,
      sortBy,
      lat,
      lng,
      radius
    );

    return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_FOUND);
  } catch (err) {
    next(err);
  }
};



  listMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      if (!userId)
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 12;

      const result = await this.matchmakingService.listMine(userId, page, limit);
      return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const id = req.params.id;

      const updated = await this.matchmakingService.update(userId, id, req.body || {});
      if (!updated)
        return ResponseHelper.notFound(res, HttpResponse.PAGE_NOT_FOUND);

      return ResponseHelper.ok(res, updated, HttpResponse.RESOURCE_UPDATED);
    } catch (err) {
      next(err);
    }
  };

  changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const id = req.params.id;
      const status = req.body?.status;

      const validStatuses = ["active", "matched", "closed"];
      if (!validStatuses.includes(status))
        return ResponseHelper.badRequest(res, "Invalid status");

      const updated = await this.matchmakingService.changeStatus(userId, id, status);
      if (!updated)
        return ResponseHelper.notFound(res, HttpResponse.PAGE_NOT_FOUND);

      return ResponseHelper.ok(res, updated, HttpResponse.RESOURCE_UPDATED);
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      const id = req.params.id;

      const ok = await this.matchmakingService.remove(userId, id);
      if (!ok) return ResponseHelper.notFound(res, HttpResponse.PAGE_NOT_FOUND);

      return ResponseHelper.noContent(res);
    } catch (err) {
      next(err);
    }
  };
}
