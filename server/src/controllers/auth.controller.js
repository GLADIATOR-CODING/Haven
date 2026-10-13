import * as authService from '../services/auth.service.js';
import { getCookieOptions } from '../utils/tokens.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signup = asyncHandler(async (req, res) => {
  const { user, token } = await authService.signup(req.body);
  res.cookie('haven_token', token, getCookieOptions());
  res.status(201).json({ user, token });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.cookie('haven_token', token, getCookieOptions());
  res.status(200).json({ user, token });
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
