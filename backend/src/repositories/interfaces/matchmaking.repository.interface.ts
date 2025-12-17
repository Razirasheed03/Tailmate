export interface IMatchmakingRepository {
  create(userId: string, body: any): Promise<any>;

  listPublic(params: {
    page: number;
    limit: number;
    q?: string;
    place?: string;
    sortBy?: string;
    lat?: number;
    lng?: number;
    radius?: number;
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
    status: "active" | "matched" | "closed"
  ): Promise<any | null>;

  remove(userId: string, id: string): Promise<boolean>;

  findById(id: string): Promise<any | null>;
}
