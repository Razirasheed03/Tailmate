// src/http/ResponseHelper.ts
import { Response } from 'express';
import { ApiResponse, ApiSuccess, ApiError, ErrorItem } from './response.types';
import { HttpStatus } from '../constants/httpStatus';

export class ResponseHelper {
  static ok<T>(res: Response<ApiResponse<T>>, data: T, message?: string) {
    const body: ApiSuccess<T> = { success: true, data, ...(message ? { message } : {}) };
    return res.status(HttpStatus.OK).json(body);
  }

  static created<T>(res: Response<ApiResponse<T>>, data: T, message?: string) {
    const body: ApiSuccess<T> = { success: true, data, ...(message ? { message } : {}) };
    return res.status(HttpStatus.CREATED).json(body);
  }

  static noContent(res: Response) {
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  static error(
    res: Response<ApiResponse<never>>,
    status: number,
    code: string,
    message: string,
    errors?: ErrorItem[],
    details?: unknown
  ) {
    const body: ApiError = {
      success: false,
      code,
      message,
      ...(errors ? { errors } as Pick<ApiError, 'errors'> : {}),
      ...(details !== undefined ? { details } as Pick<ApiError, 'details'> : {})
    };
    return res.status(status).json(body);
  }

  static badRequest(res: Response<ApiResponse<never>>, message = 'Validation failed', errors?: ErrorItem[]) {
    return this.error(res, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', message, errors);
  }

  static unauthorized(res: Response<ApiResponse<never>>, message = 'Unauthorized') {
    return this.error(res, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', message);
  }

  static forbidden(res: Response<ApiResponse<never>>, message = 'Forbidden') {
    return this.error(res, HttpStatus.FORBIDDEN, 'FORBIDDEN', message);
  }

  static notFound(res: Response<ApiResponse<never>>, message = 'Not found') {
    return this.error(res, HttpStatus.NOT_FOUND, 'NOT_FOUND', message);
  }

  static conflict(res: Response<ApiResponse<never>>, message = 'Conflict') {
    return this.error(res, HttpStatus.CONFLICT, 'CONFLICT', message);
  }

  static internal(res: Response<ApiResponse<never>>, message = 'Internal server error', details?: unknown) {
    return this.error(res, HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', message, undefined, details);
  }
}
