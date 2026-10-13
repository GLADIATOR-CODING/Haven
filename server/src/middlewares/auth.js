import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/tokens.js';
import { User } from '../models/User.js';

export async function auth(req, res, next) {
  try {
    const token =
      req.cookies?.haven_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

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
