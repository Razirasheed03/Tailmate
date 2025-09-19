// Base response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  timestamp: string;
  requestId?: string;
}

// Error details interface
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Success response helper type
export type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  timestamp: string;
  requestId?: string;
};

// Error response helper type
export type ErrorResponse = {
  success: false;
  message: string;
  error: ApiError;
  timestamp: string;
  requestId?: string;
};
