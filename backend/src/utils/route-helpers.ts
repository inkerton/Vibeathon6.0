import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Safely extract a single string parameter from route params
 * Handles the case where Express might return string | string[]
 */
export function getRouteParam(req: Request, paramName: string): string {
  const param = req.params[paramName];
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

/**
 * Safely extract a single string from query params
 */
export function getQueryParam(req: Request, paramName: string): string | undefined {
  const param = req.query[paramName];
  if (Array.isArray(param)) {
    return param[0] as string;
  }
  return param as string | undefined;
}

/**
 * Type-safe wrapper for authenticated route handlers
 * Casts Request to AuthRequest for TypeScript
 * Returns a standard Express RequestHandler
 */
export function authHandler(
  handler: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void
): any {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await handler(req as AuthRequest, res, next);
    } catch (error) {
      next(error);
    }
  };
}