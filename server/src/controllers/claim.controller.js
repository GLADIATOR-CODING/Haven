import { asyncHandler } from '../utils/asyncHandler.js';
import * as claimService from '../services/claims/claim.service.js';

export const createClaim = asyncHandler(async (req, res) => {
  const result = await claimService.createClaim(req.org, req.user, req.body);
  res.status(201).json(result);
});

export const getMyClaims = asyncHandler(async (req, res) => {
  const claims = await claimService.getMyClaims(req.org._id, req.user._id, req.org);
  res.status(200).json({ claims });
});

export const getClaimById = asyncHandler(async (req, res) => {
  const result = await claimService.getClaimById(req.org._id, req.params.id, req.user, req.org);
  res.status(200).json(result);
});

export const getOrgClaims = asyncHandler(async (req, res) => {
  const claims = await claimService.getOrgClaims(req.org._id, req.query, req.org);
  res.status(200).json({ claims });
});

export const reviewClaim = asyncHandler(async (req, res) => {
  const result = await claimService.reviewClaim(req.org._id, req.params.id, req.user, req.body, req.org);
  res.status(200).json(result);
});

export const verifyHandover = asyncHandler(async (req, res) => {
  const result = await claimService.verifyHandover(req.org._id, req.body, req.user, req.org);
  res.status(200).json(result);
});

