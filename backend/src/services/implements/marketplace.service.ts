// src/services/implements/marketplace.service.ts
import { MarketplaceRepository } from "../../repositories/implements/marketplace.repository";

// Small shared types for clarity
export type MarketplaceCreatePayload = {
  title: string;
  description: string;
  photos: string[];
  price: number | null;
  ageText?: string;
  place: string;
  contact: string;
};

export type MarketplaceItem = any; // TODO: replace with concrete entity/DTO from repository

// Frontend expects `data`, not `items`
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

export class MarketplaceService {
  constructor(private readonly _repo = new MarketplaceRepository()) {}

  async create(userId: string, payload: MarketplaceCreatePayload): Promise<MarketplaceItem> {
    if (!payload.title?.trim()) throw new Error("Title is required");
    if (!payload.description?.trim()) throw new Error("Description is required");
    if (!payload.place?.trim()) throw new Error("Place is required");
    if (!payload.contact?.trim()) throw new Error("Contact is required");
    if (!Array.isArray(payload.photos)) payload.photos = [];
    if (payload.photos.length > 6) throw new Error("Max 6 photos");

    return this._repo.create(userId, {
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

    // Normalize to `data` for frontend compatibility
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
    // Normalize to `data`
    return {
      data: res.data,
      total: res.total,
      page: res.page,
      totalPages: res.totalPages,
    };
  }

  update(userId: string, id: string, patch: Partial<MarketplaceCreatePayload>): Promise<MarketplaceItem> {
    if (patch?.title && String(patch.title).trim().length < 3) throw new Error("Title too short");
    if (patch?.description && String(patch.description).trim().length < 10)
      throw new Error("Description too short");
    if ("photos" in patch && Array.isArray(patch.photos) && patch.photos.length > 6)
      throw new Error("Max 6 photos");
    return this._repo.update(userId, id, patch);
  }

  // Supports both old and new status values; maps to backend values
  changeStatus(userId: string, id: string, status: MarketStatus): Promise<MarketplaceItem> {
    const statusMap: Record<MarketStatus, "active" | "reserved" | "closed"> = {
      active: "active",
      inactive: "reserved", // inactive maps to reserved
      sold: "closed",
      adopted: "closed",
      reserved: "reserved",
      closed: "closed",
    };

    const mappedStatus = statusMap[status] ?? "active";
    return this._repo.changeStatus(userId, id, mappedStatus);
  }

  // New method for completion status
  markAsComplete(userId: string, id: string, status: "sold" | "adopted"): Promise<MarketplaceItem> {
    // Domain rule: completion always closes the listing
    return this._repo.changeStatus(userId, id, "closed");
  }

  remove(userId: string, id: string): Promise<boolean> {
    return this._repo.remove(userId, id);
  }
}
