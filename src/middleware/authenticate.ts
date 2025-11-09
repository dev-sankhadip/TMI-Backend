import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../Shared/config';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    (req as any).userid = (decoded as any).userId; // Include the userId in the request object
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};
