import type { Request, Response, NextFunction, RequestHandler } from "express";

// Utility for catching errors in async/await handlers and forwarding to Express
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    // No return needed!
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
