import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Membership } from '../models/Membership.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/tokens.js';

export async function signup({ name, email, password }) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
  });

  const token = signToken({ id: user._id, email: user.email });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = signToken({ id: user._id, email: user.email });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function getMe(userId) {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User profile not found');
  }

  const memberships = await Membership.find({ userId })
    .populate('orgId', 'name slug templateKey accentColor handoverInstructions')
    .sort({ createdAt: -1 });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    memberships: memberships.map((m) => ({
      id: m._id,
      orgId: m.orgId?._id,
      orgName: m.orgId?.name,
      orgSlug: m.orgId?.slug,
      templateKey: m.orgId?.templateKey,
      accentColor: m.orgId?.accentColor,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  };
}
