export interface IMatchmakingService {
  create(userId: string, payload: any): Promise<any>;

  listPublic(
    page: number,
    limit: number,
    q?: string,
    place?: string,
    sortBy?: string,
    lat?: number,
    lng?: number,
    radius?: number
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  listMine(userId: string, page: number, limit: number): Promise<any>;

  update(userId: string, id: string, patch: any): Promise<any>;

  changeStatus(
    userId: string,
    id: string,
    status: "active" | "matched" | "closed"
  ): Promise<any>;

  remove(userId: string, id: string): Promise<boolean>;
}
