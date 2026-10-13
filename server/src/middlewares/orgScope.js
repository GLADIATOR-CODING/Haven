import { ApiError } from '../utils/ApiError.js';
import { Organization } from '../models/Organization.js';
import { Membership } from '../models/Membership.js';

export async function orgScope(req, res, next) {
  try {
    const { slug } = req.params;
    if (!slug) {
      throw new ApiError(400, 'SLUG_REQUIRED', 'Organization slug is required');
    }

    if (!req.user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required');
    }

    // 1. Find the organization by slug
    const org = await Organization.findOne({ slug: slug.toLowerCase() });
    if (!org) {
      // Return 404 to avoid leaking organization existence
      throw new ApiError(404, 'NOT_FOUND', 'Organization not found');
    }

    // 2. Check the caller's membership in this organization
    const membership = await Membership.findOne({
      userId: req.user._id,
      orgId: org._id,
    });

    if (!membership) {
      // Return 404 (NEVER 403) so non-members cannot probe organization existence
      throw new ApiError(404, 'NOT_FOUND', 'Organization not found');
    }

    // Attach to request
    req.org = org;
    req.membership = membership;

    next();
  } catch (err) {
    next(err);
  }
}
