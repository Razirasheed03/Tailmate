// backend/src/services/implements/marketplace.service.ts
import { MarketplaceRepository } from "../../repositories/implements/marketplace.repository";
import { IMarketplaceService } from "../interfaces/marketplace.service.interface";

export type MarketplaceCreatePayload = {
  petId: string;
  title: string;
  description: string;
  photos: string[];
  price: number | null;
  ageText?: string;
  place: string;
  contact: string;
};

export type MarketplaceItem = any;

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

export type ListPublicParams = {
  page: number;
  limit: number;
  type?: string;
  q?: string;
  place?: string;
  minPrice?: number;
  maxPrice?: number;
  excludeFree?: boolean;
  sortBy?: string;
};

export type MarketStatus =
  | "active"
  | "reserved"
  | "closed"
  | "inactive"
  | "sold"
  | "adopted";

export class MarketplaceService implements IMarketplaceService{
  constructor(private readonly _repo = new MarketplaceRepository()) {}

async create(userId: string, payload: MarketplaceCreatePayload): Promise<any> {
  if (!payload.petId) throw Object.assign(new Error("petId is required"), { status: 400 });
  if (!payload.title?.trim()) throw Object.assign(new Error("Title is required"), { status: 400 });
  if (!payload.description?.trim()) throw Object.assign(new Error("Description is required"), { status: 400 });
  if (!payload.place?.trim()) throw Object.assign(new Error("Place is required"), { status: 400 });
  if (!payload.contact?.trim()) throw Object.assign(new Error("Contact is required"), { status: 400 });
  if (!Array.isArray(payload.photos)) payload.photos = [];
  if (payload.photos.length > 6) throw Object.assign(new Error("Max 6 photos"), { status: 400 });

  return this._repo.create(userId, {
    petId: payload.petId,
    title: payload.title.trim(),
    description: payload.description.trim(),
    photos: payload.photos,
    price: payload.price ?? null,
    ageText: payload.ageText?.trim() || "",
    place: payload.place.trim(),
    contact: payload.contact.trim(),
  });
}

  async listPublic(
    page: number,
    limit: number,
    type?: string,
    q?: string,
    place?: string,
    priceOptions?: {
      minPrice?: number;
      maxPrice?: number;
      excludeFree?: boolean;
      sortBy?: string;
    }
  ): Promise<Paginated<MarketplaceItem>> {
    page = Math.max(1, Number(page) || 1);
    limit = Math.min(50, Math.max(1, Number(limit) || 10));

    const res = await this._repo.listPublic({
      page,
      limit,
      type,
      q,
      place,
      minPrice: priceOptions?.minPrice,
      maxPrice: priceOptions?.maxPrice,
      excludeFree: priceOptions?.excludeFree,
      sortBy: priceOptions?.sortBy,
    } as ListPublicParams);

    return {
      data: res.data,
      total: res.total,
      page: res.page,
      totalPages: res.totalPages,
    };
  }

  async listMine(userId: string, page: number, limit: number): Promise<Paginated<MarketplaceItem>> {
    page = Math.max(1, Number(page) || 1);
    limit = Math.min(50, Math.max(1, Number(limit) || 10));
    const res = await this._repo.listMine(userId, page, limit);
    return {
      data: res.data,
      total: res.total,
      page: res.page,
      totalPages: res.totalPages,
    };
  }

  update(userId: string, id: string, patch: Partial<MarketplaceCreatePayload>): Promise<MarketplaceItem> {
    if (patch?.title && String(patch.title).trim().length < 3) throw Object.assign(new Error("Title too short"), { status: 400 });
    if (patch?.description && String(patch.description).trim().length < 10)
      throw Object.assign(new Error("Description too short"), { status: 400 });
    if ("photos" in patch && Array.isArray(patch.photos) && patch.photos.length > 6)
      throw Object.assign(new Error("Max 6 photos"), { status: 400 });
    return this._repo.update(userId, id, patch);
  }

  changeStatus(userId: string, id: string, status: MarketStatus): Promise<MarketplaceItem> {
    const statusMap: Record<MarketStatus, "active" | "reserved" | "closed"> = {
      active: "active",
      inactive: "reserved",
      sold: "closed",
      adopted: "closed",
      reserved: "reserved",
      closed: "closed",
    };
    const mappedStatus = statusMap[status] ?? "active";
    return this._repo.changeStatus(userId, id, mappedStatus);
  }

  markAsComplete(userId: string, id: string, status: "sold" | "adopted"): Promise<MarketplaceItem> {
    return this._repo.changeStatus(userId, id, "closed");
  }

  remove(userId: string, id: string): Promise<boolean> {
    return this._repo.remove(userId, id);
  }
}
