// src/dtos/admin/user.dto.ts
export interface UserListItemDTO {
  id: string;
  username: string;
  email: string;
  role: string;
  isBlocked: boolean;
  createdAt: Date;
}

export interface UserListResponseDTO {
  users: UserListItemDTO[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UserStatsDTO {
  totalUsers: number;
  totalDoctors: number;
  blockedUsers: number;
}

export interface UserActionResponseDTO {
  message: string;
}
