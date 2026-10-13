import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Membership } from '../src/models/Membership.js';
import { Report } from '../src/models/Report.js';
import { loadTemplate } from '../src/services/org.service.js';

export async function seedInternal() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Demo Users
  const adminUser = await User.create({
    name: 'Campus Admin',
    email: 'admin@haven.local',
    passwordHash,
  });

  const modUser = await User.create({
    name: 'Security Desk',
    email: 'mod@haven.local',
    passwordHash,
  });

  const member1 = await User.create({
    name: 'Alex Rivera',
    email: 'alex@haven.local',
    passwordHash,
  });

  const member2 = await User.create({
    name: 'Sam Chen',
    email: 'sam@haven.local',
    passwordHash,
  });

  // 2. Load templates
  const campusTpl = loadTemplate('campus');
  const officeTpl = loadTemplate('office');

  // 3. Create Org 1: Demo Campus
  const campusOrg = await Organization.create({
    name: 'Demo Campus University',
    slug: 'demo-campus',
    createdBy: adminUser._id,
    templateKey: 'campus',
    join: {
      code: 'CAMPUS',
      rotatedAt: new Date(),
    },
    categories: campusTpl.categories,
    locations: campusTpl.locations,
    claimPolicy: { minMatchingDetails: 1, maxAttempts: 3 },
    matchSensitivity: 'balanced',
    handoverInstructions: 'Main Campus Security Desk (Gate 1), 9:00 AM - 6:00 PM on weekdays.',
    expiryDays: 60,
    timeWindowHours: 72,
    aiEnabled: true,
    accentColor: '#2563eb',
  });

  // 4. Create Org 2: Demo Office
  const officeOrg = await Organization.create({
    name: 'Demo Tech Park HQ',
    slug: 'demo-office',
    createdBy: adminUser._id,
    templateKey: 'office',
    join: {
      code: 'OFFICE',
      rotatedAt: new Date(),
    },
    categories: officeTpl.categories,
    locations: officeTpl.locations,
    claimPolicy: { minMatchingDetails: 2, maxAttempts: 3 },
    matchSensitivity: 'strict',
    handoverInstructions: 'Reception Counter, 4th Floor Tech Tower, 9:00 AM - 6:00 PM.',
    expiryDays: 30,
    timeWindowHours: 48,
    aiEnabled: true,
    accentColor: '#059669',
  });

  // 5. Create Memberships
  await Membership.create([
    { userId: adminUser._id, orgId: campusOrg._id, role: 'admin' },
    { userId: modUser._id, orgId: campusOrg._id, role: 'moderator' },
    { userId: member1._id, orgId: campusOrg._id, role: 'member' },
    { userId: member2._id, orgId: campusOrg._id, role: 'member' },

    { userId: adminUser._id, orgId: officeOrg._id, role: 'admin' },
    { userId: member1._id, orgId: officeOrg._id, role: 'member' },
  ]);

  // 6. Seed Sample Reports (guaranteed match & sample feed items)
  await Report.create([
    {
      orgId: campusOrg._id,
      type: 'found',
      status: 'published',
      reporterId: modUser._id,
      category: 'electronics',
      title: 'Sony Wireless Headphones (Blue)',
      description: 'Found on table 14 near the second-floor periodicals section.',
      colors: ['Blue', 'Black'],
      brand: 'Sony',
      location: 'library',
      locationNote: 'Second floor study hall',
      occurredFrom: new Date(Date.now() - 3600000 * 2),
      occurredTo: new Date(Date.now() - 3600000 * 2),
      photo: { url: '', publicId: '' },
      expiresAt: new Date(Date.now() + 86400000 * 60),
    },
    {
      orgId: campusOrg._id,
      type: 'found',
      status: 'published',
      reporterId: member1._id,
      category: 'bottles_umbrellas',
      title: 'Hydro Flask 32oz (Silver)',
      description: 'Stainless steel water bottle with mountain sticker.',
      colors: ['Silver'],
      brand: 'Hydro Flask',
      location: 'cafeteria',
      locationNote: 'Counter seating',
      occurredFrom: new Date(Date.now() - 3600000 * 5),
      occurredTo: new Date(Date.now() - 3600000 * 5),
      photo: { url: '', publicId: '' },
      expiresAt: new Date(Date.now() + 86400000 * 60),
    },
    {
      orgId: campusOrg._id,
      type: 'found',
      status: 'pending_review',
      reporterId: member2._id,
      category: 'id_card',
      title: 'Student ID Card (Engineering)',
      description: 'Blue lanyard with college identity badge.',
      colors: ['Blue'],
      location: 'block_a',
      occurredFrom: new Date(Date.now() - 3600000 * 1),
      occurredTo: new Date(Date.now() - 3600000 * 1),
      photo: { url: '', publicId: '' },
      expiresAt: new Date(Date.now() + 86400000 * 60),
    },
  ]);
}
