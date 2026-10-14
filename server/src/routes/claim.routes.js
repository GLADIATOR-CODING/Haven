import { Router } from 'express';
import * as claimController from '../controllers/claim.controller.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router({ mergeParams: true });

// POST /api/o/:slug/claims (Submit Claim - member or above)
router.post('/', claimController.createClaim);

// GET /api/o/:slug/claims/mine (Claimant's claims)
router.get('/mine', claimController.getMyClaims);

// GET /api/o/:slug/claims (Desk list of claims - Moderator or Admin only)
router.get('/', authorize('admin', 'moderator'), claimController.getOrgClaims);

// POST /api/o/:slug/claims/handover (Desk handover verification - Moderator or Admin only)
router.post('/handover', authorize('admin', 'moderator'), claimController.verifyHandover);

// PATCH /api/o/:slug/claims/:id/review (Approve or Reject claim - Moderator or Admin only)
router.patch('/:id/review', authorize('admin', 'moderator'), claimController.reviewClaim);

// GET /api/o/:slug/claims/:id (Single claim)
router.get('/:id', claimController.getClaimById);

export default router;

