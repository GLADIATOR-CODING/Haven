import { ApiError } from '../utils/ApiError.js';

export function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!req.membership) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Membership context missing'));
    }

    if (!allowedRoles.includes(req.membership.role)) {
      return next(
        new ApiError(403, 'FORBIDDEN', `Access forbidden: requires ${allowedRoles.join(' or ')} role`)
      );
    }

    next();
  };
}
