import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Membership } from '../models/Membership.js';
import { Organization } from '../models/Organization.js';
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
  const profile = await getMe(user._id);

  return {
    ...profile,
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
  const profile = await getMe(user._id);

  return {
    ...profile,
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
      avatar: user.avatar || '',
      phoneNumber: user.phoneNumber || '',
      bio: user.bio || '',
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

export async function updateProfile(userId, { name, avatar, phoneNumber, bio }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User profile not found');
  }

  if (name !== undefined && name.trim()) user.name = name.trim();
  if (avatar !== undefined) user.avatar = avatar.trim();
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
  if (bio !== undefined) user.bio = bio.trim();

  await user.save();
  return getMe(userId);
}


export async function demoLogin({ role = 'member', orgSlug = 'demo-campus' }) {
  let demoEmail;
  if (role === 'admin') {
    demoEmail = 'admin@haven.local';
  } else if (role === 'moderator') {
    demoEmail = 'mod@haven.local';
  } else {
    demoEmail = 'alex@haven.local';
  }

  const user = await User.findOne({ email: demoEmail });
  if (!user) {
    throw new ApiError(404, 'DEMO_USER_NOT_FOUND', `Demo user for role ${role} not found.`);
  }

  const normalizedSlug =
    orgSlug === 'campus' ? 'demo-campus' : orgSlug === 'office' ? 'demo-office' : orgSlug;

  if (!['demo-campus', 'demo-office'].includes(normalizedSlug)) {
    throw new ApiError(400, 'INVALID_DEMO_WORKSPACE', 'Demo sign-in is only available for demo workspaces.');
  }

  const org = await Organization.findOne({ slug: normalizedSlug });
  if (!org) {
    throw new ApiError(404, 'DEMO_WORKSPACE_NOT_FOUND', 'The requested demo workspace has not been seeded yet.');
  }

  // Demo sign-in is also a role reset. This keeps Alex a member even if an
  // evaluator previously promoted the account while testing the admin UI.
  await Membership.findOneAndUpdate(
    { userId: user._id, orgId: org._id },
    { $set: { role } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const token = signToken({ id: user._id, email: user.email });
  const profile = await getMe(user._id);

  return {
    ...profile,
    token,
    activeOrgSlug: normalizedSlug,
  };
}

export async function getAdminModeratorRequests(userId) {
  const adminMemberships = await Membership.find({ userId, role: 'admin' });
  const orgIds = adminMemberships.map((m) => m.orgId);
  if (orgIds.length === 0) {
    return [];
  }

  const { ModeratorRequest } = await import('../models/ModeratorRequest.js');
  return ModeratorRequest.find({ orgId: { $in: orgIds } })
    .populate('userId', 'name email avatar phoneNumber bio createdAt')
    .populate('orgId', 'name slug templateKey')
    .sort({ createdAt: -1 });
}
