import * as authService from '../services/auth.service.js';
import { getCookieOptions } from '../utils/tokens.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.cookie('haven_token', result.token, getCookieOptions());
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie('haven_token', result.token, getCookieOptions());
  res.status(200).json(result);
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('haven_token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  const profile = await authService.getMe(req.user._id);
  res.status(200).json(profile);
});

export const demoLogin = asyncHandler(async (req, res) => {
  const result = await authService.demoLogin(req.body);
  res.cookie('haven_token', result.token, getCookieOptions());
  res.status(200).json(result);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const fileBuffer = req.file?.buffer || null;
  let avatarUrl = req.body.avatar;

  if (fileBuffer) {
    const { processAndSaveImage } = await import('../services/storage/storage.service.js');
    const uploaded = await processAndSaveImage(fileBuffer);
    if (uploaded?.url) {
      avatarUrl = uploaded.url;
    }
  }

  const profile = await authService.updateProfile(req.user._id, {
    name: req.body.name,
    avatar: avatarUrl,
    phoneNumber: req.body.phoneNumber,
    bio: req.body.bio,
  });

  res.status(200).json(profile);
});

export const getAdminModeratorRequests = asyncHandler(async (req, res) => {
  const requests = await authService.getAdminModeratorRequests(req.user._id);
  res.status(200).json({ requests });
});

