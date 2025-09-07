import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  id: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(createError('Access denied. No token provided.', 401));
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(createError('JWT secret not configured', 500));
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Check if user still exists
    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return next(createError('User no longer exists', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(createError('User account is deactivated', 401));
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(createError('Invalid token', 401));
  }
};

export const authorize = (...roles: Array<'user' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Access denied. Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};

export const requireKYC = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(createError('Access denied. Authentication required.', 401));
  }

  if (req.user.kycStatus !== 'approved') {
    return next(createError('KYC verification required. Please complete your verification.', 403));
  }

  next();
};
