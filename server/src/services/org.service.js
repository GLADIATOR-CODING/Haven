import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Organization } from '../models/Organization.js';
import { Membership } from '../models/Membership.js';
import { User } from '../models/User.js';
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
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters/digits
}

export function isEmailDomainAllowed(email, allowedDomains = []) {
  if (!email) return false;
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const emailLower = email.toLowerCase().trim();
  const emailDomain = emailLower.split('@')[1];
  if (!emailDomain) return false;

  return allowedDomains.some((d) => {
    const cleanDomain = d.replace(/^@/, '').toLowerCase().trim();
    if (!cleanDomain) return false;
    return emailDomain === cleanDomain || emailDomain.endsWith('.' + cleanDomain);
  });
}

export async function createOrg(input, userId) {
  const caller = await User.findById(userId);
  if (caller && caller.email?.endsWith('@haven.local')) {
    throw new ApiError(403, 'DEMO_ACCOUNT_RESTRICTED', 'Pre-seeded demo accounts are restricted to demo workspaces and cannot create new organizations.');
  }

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

  let allowedDomains = [];
  if (Array.isArray(input.allowedDomains) && input.allowedDomains.length > 0) {
    allowedDomains = input.allowedDomains
      .map((d) => (typeof d === 'string' ? d.replace(/^@/, '').toLowerCase().trim() : ''))
      .filter(Boolean);
  } else if (caller && caller.email && caller.email.includes('@')) {
    const creatorDomain = caller.email.split('@')[1].toLowerCase().trim();
    allowedDomains = [creatorDomain];
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
    allowedDomains,
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

export async function joinOrg(payload, userId) {
  const code = typeof payload === 'string' ? payload : payload?.code;
  const slug = typeof payload === 'object' ? payload?.slug : undefined;

  const caller = await User.findById(userId);
  if (!caller) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required');
  }

  // 1. If code is provided, check if it matches an 8-digit admin access code
  if (code && typeof code === 'string') {
    const normalizedCode = code.trim().toUpperCase();
    const orgByCode = await Organization.findOne({ 'join.code': normalizedCode });
    if (orgByCode) {
      if (caller.email?.endsWith('@haven.local') && !['demo-campus', 'demo-office'].includes(orgByCode.slug)) {
        throw new ApiError(403, 'DEMO_ACCOUNT_RESTRICTED', 'Pre-seeded demo accounts are restricted to demo workspaces.');
      }

      // Joining with Admin Access Code grants/elevates to ADMIN
      let membership = await Membership.findOne({ userId, orgId: orgByCode._id });
      if (membership) {
        if (membership.role !== 'admin') {
          membership.role = 'admin';
          await membership.save();
        }
        return { org: orgByCode, membership, role: 'admin', asAdmin: true, alreadyMember: true };
      }

      membership = await Membership.create({
        userId,
        orgId: orgByCode._id,
        role: 'admin',
      });
      return { org: orgByCode, membership, role: 'admin', asAdmin: true, alreadyMember: false };
    }

    // If code doesn't match an admin code, check if user provided a workspace slug
    const orgByInputSlug = await Organization.findOne({ slug: code.toLowerCase().trim() });
    if (orgByInputSlug) {
      return joinMemberByDomain(orgByInputSlug, caller);
    }
  }

  // 2. If slug is explicitly provided, verify domain and join as member
  if (slug && typeof slug === 'string') {
    const orgBySlug = await Organization.findOne({ slug: slug.toLowerCase().trim() });
    if (orgBySlug) {
      return joinMemberByDomain(orgBySlug, caller);
    }
  }

  throw new ApiError(404, 'INVALID_CODE', 'Invalid 8-digit admin access code or workspace slug');
}

async function joinMemberByDomain(org, caller) {
  if (caller.email?.endsWith('@haven.local') && !['demo-campus', 'demo-office'].includes(org.slug)) {
    throw new ApiError(403, 'DEMO_ACCOUNT_RESTRICTED', 'Pre-seeded demo accounts are restricted to demo workspaces.');
  }

  if (!isEmailDomainAllowed(caller.email, org.allowedDomains)) {
    const userDomain = caller.email?.split('@')[1] || 'unknown';
    const allowedList = (org.allowedDomains && org.allowedDomains.length > 0)
      ? org.allowedDomains.map((d) => '@' + d).join(', ')
      : 'Restricted domain list';
    throw new ApiError(
      403,
      'DOMAIN_RESTRICTED',
      `Your email domain (@${userDomain}) is not authorized to join ${org.name}. Authorized domains: ${allowedList}`
    );
  }

  let membership = await Membership.findOne({ userId: caller._id, orgId: org._id });
  if (membership) {
    return { org, membership, role: membership.role, alreadyMember: true };
  }

  membership = await Membership.create({
    userId: caller._id,
    orgId: org._id,
    role: 'member',
  });

  return { org, membership, role: 'member', alreadyMember: false };
}

export async function joinOrgByCode(code, userId) {
  return joinOrg({ code }, userId);
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
    'allowedDomains',
  ];

  const payload = {};
  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      payload[key] = updateData[key];
    }
  }

  if (payload.allowedDomains && Array.isArray(payload.allowedDomains)) {
    payload.allowedDomains = payload.allowedDomains
      .map((d) => (typeof d === 'string' ? d.replace(/^@/, '').toLowerCase().trim() : ''))
      .filter(Boolean);
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
