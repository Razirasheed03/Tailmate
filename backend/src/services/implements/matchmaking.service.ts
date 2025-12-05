import { MatchmakingRepository } from "../../repositories/implements/matchmaking.repository";

export class MatchmakingService {
  constructor(private readonly _repo = new MatchmakingRepository()) {}

  async create(userId: string, payload: any) {
    if (!payload.petId)
      throw Object.assign(new Error("petId is required"), { status: 400 });
    if (!payload.title?.trim())
      throw Object.assign(new Error("Title is required"), { status: 400 });
    if (!payload.description?.trim())
      throw Object.assign(new Error("Description is required"), {
        status: 400,
      });
    if (!payload.place?.trim())
      throw Object.assign(new Error("Place is required"), { status: 400 });
    if (!payload.contact?.trim())
      throw Object.assign(new Error("Contact is required"), { status: 400 });

    if (!Array.isArray(payload.photos)) payload.photos = [];
    if (payload.photos.length > 6)
      throw Object.assign(new Error("Max 6 photos allowed"), { status: 400 });

    return this._repo.create(userId, payload);
  }

  async listPublic(
    page: number,
    limit: number,
    q?: string,
    place?: string,
    sortBy?: string
  ) {
    return this._repo.listPublic({ page, limit, q, place, sortBy });
  }

  async listMine(userId: string, page: number, limit: number) {
    return this._repo.listMine(userId, page, limit);
  }

  async update(userId: string, id: string, patch: any) {
    return this._repo.update(userId, id, patch);
  }

  async changeStatus(
    userId: string,
    id: string,
    status: "active" | "matched" | "closed"
  ) {
    return this._repo.changeStatus(userId, id, status);
  }

  async remove(userId: string, id: string) {
    return this._repo.remove(userId, id);
  }
}
