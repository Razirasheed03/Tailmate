import { Paginated, MarketplaceItem, MarketStatus } from "../implements/marketplace.service";

export interface IMarketplaceService {
  create(userId: string, payload: any): Promise<MarketplaceItem>;

  listPublic(
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
  ): Promise<Paginated<MarketplaceItem>>;

  listMine(
    userId: string,
    page: number,
    limit: number
  ): Promise<Paginated<MarketplaceItem>>;

  update(
    userId: string,
    id: string,
    patch: Partial<any>
  ): Promise<MarketplaceItem>;

  changeStatus(
    userId: string,
    id: string,
    status: MarketStatus
  ): Promise<MarketplaceItem>;

  markAsComplete(
    userId: string,
    id: string,
    status: "sold" | "adopted"
  ): Promise<MarketplaceItem>;

  remove(userId: string, id: string): Promise<boolean>;
}
