import { Request, Response, NextFunction, RequestHandler } from 'express';

/** Strip $ and . from all string values in req.body to prevent NoSQL injection */
const sanitizeValue = (val: any): any => {
  if (typeof val === 'string') return val.replace(/[$.]/, '');
  if (Array.isArray(val))      return val.map(sanitizeValue);
  if (val && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, sanitizeValue(v)]));
  }
  return val;
};

export const sanitizeBody: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeValue(req.body);
  next();
};

/** Remove HTML tags from string fields to prevent XSS in stored content */
const stripTags = (val: any): any => {
  if (typeof val === 'string') return val.replace(/<[^>]*>/g, '');
  if (Array.isArray(val))      return val.map(stripTags);
  if (val && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, stripTags(v)]));
  }
  return val;
};

export const sanitizeXSS: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) req.body = stripTags(req.body);
  next();
};