export interface IMarketplaceRepository {
  create(userId: string, body: any): Promise<any>;

  listPublic(params: {
    page: number;
    limit: number;
    type?: string;
    q?: string;
    place?: string;
    minPrice?: number;
    maxPrice?: number;
    excludeFree?: boolean;
    sortBy?: string;
  }): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  listMine(
    userId: string,
    page: number,
    limit: number
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  update(userId: string, id: string, patch: any): Promise<any | null>;

  changeStatus(
    userId: string,
    id: string,
    status: "active" | "reserved" | "closed"
  ): Promise<any | null>;

  remove(userId: string, id: string): Promise<boolean>;
}
