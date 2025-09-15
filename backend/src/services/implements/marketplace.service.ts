import { MarketplaceRepository } from '../../repositories/implements/marketplace.repository';

export class MarketplaceService {
  constructor(private readonly repo = new MarketplaceRepository()) {}

  async create(userId: string, payload: {
    title: string;
    description: string;
    photos: string[];
    price: number | null;
    ageText?: string;
    place: string;
    contact: string;
  }) {
    if (!payload.title?.trim()) throw new Error('Title is required');
    if (!payload.description?.trim()) throw new Error('Description is required');
    if (!payload.place?.trim()) throw new Error('Place is required');
    if (!payload.contact?.trim()) throw new Error('Contact is required');
    if (!Array.isArray(payload.photos)) payload.photos = [];
    if (payload.photos.length > 6) throw new Error('Max 6 photos');

    return this.repo.create(userId, {
      title: payload.title.trim(),
      description: payload.description.trim(),
      photos: payload.photos,
      price: payload.price ?? null,
      ageText: payload.ageText?.trim() || '',
      place: payload.place.trim(),
      contact: payload.contact.trim(),
    });
  }

  listPublic(page: number, limit: number, type?: string, q?: string, place?: string) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.min(50, Math.max(1, Number(limit) || 10));
    return this.repo.listPublic({ page, limit, type, q, place });
  }

  listMine(userId: string, page: number, limit: number) {
    page = Math.max(1, Number(page) || 1);
    limit = Math.min(50, Math.max(1, Number(limit) || 10));
    return this.repo.listMine(userId, page, limit);
  }

  update(userId: string, id: string, patch: any) {
    if (patch?.title && String(patch.title).trim().length < 3) throw new Error('Title too short');
    if (patch?.description && String(patch.description).trim().length < 10) throw new Error('Description too short');
    if ('photos' in patch && Array.isArray(patch.photos) && patch.photos.length > 6) throw new Error('Max 6 photos');
    return this.repo.update(userId, id, patch);
  }

  changeStatus(userId: string, id: string, status: 'active' | 'reserved' | 'closed') {
    return this.repo.changeStatus(userId, id, status);
  }

  remove(userId: string, id: string) {
    return this.repo.remove(userId, id);
  }
}
