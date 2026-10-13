import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Organization } from '../models/Organization.js';
import { Membership } from '../models/Membership.js';
import { ApiError } from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.resolve(__dirname, '../templates');

export function loadTemplate(templateKey = 'campus') {
  const filePath = path.join(templatesDir, `${templateKey.toLowerCase()}.json`);
  if (!fs.existsSync(filePath)) {
    const blankPath = path.join(templatesDir, 'blank.json');
    return JSON.parse(fs.readFileSync(blankPath, 'utf8'));
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 characters
}

export async function createOrg(input, userId) {
  const { name, templateKey = 'campus', handoverInstructions } = input;
  let slug = input.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (!slug) {
    slug = `org-${crypto.randomBytes(3).toString('hex')}`;
  }

  const existingOrg = await Organization.findOne({ slug });
  if (existingOrg) {
    throw new ApiError(409, 'SLUG_TAKEN', 'An organization with this slug already exists. Please choose another.');
  }

  const template = loadTemplate(templateKey);

  const categories = input.categories && input.categories.length > 0 ? input.categories : template.categories;
  const locations = input.locations && input.locations.length > 0 ? input.locations : template.locations;

  let inviteCode = generateInviteCode();
  // Ensure uniqueness
  while (await Organization.findOne({ 'join.code': inviteCode })) {
    inviteCode = generateInviteCode();
  }

  const org = await Organization.create({
    name,
    slug,
    createdBy: userId,
    templateKey,
    join: {
      code: inviteCode,
      rotatedAt: new Date(),
    },
    categories,
    locations,
    claimPolicy: input.claimPolicy || template.claimPolicy || { minMatchingDetails: 1, maxAttempts: 3 },
    matchSensitivity: input.matchSensitivity || template.matchSensitivity || 'balanced',
    handoverInstructions: handoverInstructions || template.handoverInstructions,
    expiryDays: input.expiryDays || 60,
    timeWindowHours: input.timeWindowHours || 72,
    aiEnabled: input.aiEnabled !== undefined ? input.aiEnabled : true,
    accentColor: input.accentColor || '#3b82f6',
  });

  const membership = await Membership.create({
    userId,
    orgId: org._id,
    role: 'admin',
  });

  return { org, membership };
}

export async function joinOrgByCode(code, userId) {
  if (!code) {
    throw new ApiError(400, 'CODE_REQUIRED', 'Invite code is required');
  }

  const normalizedCode = code.trim().toUpperCase();
  const org = await Organization.findOne({ 'join.code': normalizedCode });
  if (!org) {
    throw new ApiError(404, 'INVALID_CODE', 'Invalid or expired invite code');
  }

  // Check if already a member
  let membership = await Membership.findOne({ userId, orgId: org._id });
  if (membership) {
    return { org, membership, alreadyMember: true };
  }

  membership = await Membership.create({
    userId,
    orgId: org._id,
    role: 'member',
  });

  return { org, membership, alreadyMember: false };
}

export async function rotateInviteCode(orgId) {
  let newCode = generateInviteCode();
  while (await Organization.findOne({ 'join.code': newCode })) {
    newCode = generateInviteCode();
  }

  const org = await Organization.findByIdAndUpdate(
    orgId,
    {
      'join.code': newCode,
      'join.rotatedAt': new Date(),
    },
    { new: true }
  );

  return { code: org.join.code, rotatedAt: org.join.rotatedAt };
}

export async function updateOrgSettings(orgId, updateData) {
  const allowedUpdates = [
    'name',
    'categories',
    'locations',
    'claimPolicy',
    'matchSensitivity',
    'handoverInstructions',
    'expiryDays',
    'timeWindowHours',
    'aiEnabled',
    'accentColor',
  ];

  const payload = {};
  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      payload[key] = updateData[key];
    }
  }

  if (payload.categories && payload.categories.length === 0) {
    throw new ApiError(400, 'INVALID_CONFIG', 'Organization must have at least one category');
  }
  if (payload.locations && payload.locations.length === 0) {
    throw new ApiError(400, 'INVALID_CONFIG', 'Organization must have at least one location');
  }

  const updatedOrg = await Organization.findByIdAndUpdate(orgId, { $set: payload }, { new: true, runValidators: true });
  return updatedOrg;
}

export async function getMembers(orgId) {
  const memberships = await Membership.find({ orgId })
    .populate('userId', 'name email createdAt')
    .sort({ createdAt: 1 });

  return memberships.map((m) => ({
    membershipId: m._id,
    userId: m.userId?._id,
    name: m.userId?.name,
    email: m.userId?.email,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

export async function updateMemberRole(orgId, targetUserId, newRole, currentAdminId) {
  if (targetUserId.toString() === currentAdminId.toString() && newRole !== 'admin') {
    throw new ApiError(400, 'CANNOT_DEMOTE_SELF', 'Admins cannot remove their own admin privileges');
  }

  const membership = await Membership.findOneAndUpdate(
    { orgId, userId: targetUserId },
    { role: newRole },
    { new: true }
  );

  if (!membership) {
    throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Membership record not found');
  }

  return membership;
}
