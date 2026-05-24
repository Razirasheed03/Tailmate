// src/http/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ResponseHelper } from "./ResponseHelper";
import { AppError } from "./errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    ResponseHelper.error(
      res,
      err.statusCode,
      err.code,
      err.message,
      undefined,
      err.details
    );
    return;
  }

  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;

  const message =
    err instanceof Error ? err.message : "Something went wrong.";

  if (status >= 500) {
    console.error("Unhandled error:", message);
    ResponseHelper.internal(res);
    return;
  }

  ResponseHelper.error(res, status, "REQUEST_ERROR", message);
}

