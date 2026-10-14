import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/tokens.js';
import { User } from '../models/User.js';

export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    const token = bearerToken || req.cookies?.haven_token;

    if (!token) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Session expired or invalid token');
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      throw new ApiError(401, 'USER_NOT_FOUND', 'User account does not exist');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
