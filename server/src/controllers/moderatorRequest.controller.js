import * as modReqService from '../services/moderatorRequest.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createRequest = asyncHandler(async (req, res) => {
  const request = await modReqService.createModeratorRequest(
    req.org._id,
    req.user._id,
    req.body
  );
  res.status(201).json({ request });
});

export const getRequests = asyncHandler(async (req, res) => {
  const requests = await modReqService.getModeratorRequests(
    req.org._id,
    req.user._id,
    req.membership.role
  );
  res.status(200).json({ requests });
});

export const reviewRequest = asyncHandler(async (req, res) => {
  const request = await modReqService.reviewModeratorRequest(
    req.org._id,
    req.params.id,
    req.body.action,
    req.user._id
  );
  res.status(200).json({ request });
});
