// src/utils/responseBuilder.ts
import { type SuccessResponse,type ErrorResponse } from '@/types/common.types';

export class ResponseBuilder {
  // Generate unique request ID
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Success response builder
  static success<T>(data: T, message: string = 'Success'): SuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  // Error response builder
  static error(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    details?: any
  ): ErrorResponse {
    return {
      success: false,
      message,
      error: {
        code,
        message,
        details
      },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  // Validation error builder
  static validationError(
    message: string = 'Validation failed',
    details: any
  ): ErrorResponse {
    return {
      success: false,
      message,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details
      },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  // Not found error builder
  static notFound(resource: string = 'Resource'): ErrorResponse {
    return {
      success: false,
      message: `${resource} not found`,
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`
      },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  // Unauthorized error builder
  static unauthorized(message: string = 'Unauthorized access'): ErrorResponse {
    return {
      success: false,
      message,
      error: {
        code: 'UNAUTHORIZED',
        message
      },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }
}
