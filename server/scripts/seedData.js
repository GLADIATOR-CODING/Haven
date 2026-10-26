import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Membership } from '../src/models/Membership.js';
import { Report } from '../src/models/Report.js';
import { ModeratorRequest } from '../src/models/ModeratorRequest.js';
import { loadTemplate } from '../src/services/org.service.js';

export async function seedInternal() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Upsert Demo Users
  const usersData = [
    { name: 'Campus Admin', email: 'admin@haven.local', passwordHash },
    { name: 'Security Desk', email: 'mod@haven.local', passwordHash },
    { name: 'Alex Rivera', email: 'alex@haven.local', passwordHash },
    { name: 'Sam Chen', email: 'sam@haven.local', passwordHash },
  ];

  const users = {};
  for (const u of usersData) {
    let existing = await User.findOne({ email: u.email });
    if (!existing) {
      existing = await User.create(u);
    }
    users[u.email] = existing;
  }

  const adminUser = users['admin@haven.local'];
  const modUser = users['mod@haven.local'];
  const member1 = users['alex@haven.local'];
  const member2 = users['sam@haven.local'];

  // 2. Load templates
  const campusTpl = loadTemplate('campus');
  const officeTpl = loadTemplate('office');

  // 3. Upsert Org 1: Demo Campus
  let campusOrg = await Organization.findOne({ slug: 'demo-campus' });
  if (!campusOrg) {
    campusOrg = await Organization.create({
      name: 'Demo Campus University',
      slug: 'demo-campus',
      createdBy: adminUser._id,
      templateKey: 'campus',
      join: {
        code: 'CAMPUS01',
        rotatedAt: new Date(),
      },
      allowedDomains: ['haven.local', 'gmail.com', 'sst.scaler.com', 'scaler.com', 'bits-pilani.ac.in', 'bitspilani.ac.in'],
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
  } else {
    campusOrg.allowedDomains = ['haven.local', 'gmail.com', 'sst.scaler.com', 'scaler.com', 'bits-pilani.ac.in', 'bitspilani.ac.in'];
    if (!campusOrg.join?.code || campusOrg.join.code.length < 8) {
      campusOrg.join = { code: 'CAMPUS01', rotatedAt: new Date() };
    }
    await campusOrg.save();
  }

  // 4. Upsert Org 2: Demo Office
  let officeOrg = await Organization.findOne({ slug: 'demo-office' });
  if (!officeOrg) {
    officeOrg = await Organization.create({
      name: 'Demo Tech Park HQ',
      slug: 'demo-office',
      createdBy: adminUser._id,
      templateKey: 'office',
      join: {
        code: 'OFFICE01',
        rotatedAt: new Date(),
      },
      allowedDomains: ['haven.local', 'gmail.com', 'sst.scaler.com', 'scaler.com'],
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
  } else {
    officeOrg.allowedDomains = ['haven.local', 'gmail.com', 'sst.scaler.com', 'scaler.com'];
    if (!officeOrg.join?.code || officeOrg.join.code.length < 8) {
      officeOrg.join = { code: 'OFFICE01', rotatedAt: new Date() };
    }
    await officeOrg.save();
  }

  // 5. Ensure Memberships for all demo users
  const membershipsData = [
    { userId: adminUser._id, orgId: campusOrg._id, role: 'admin' },
    { userId: modUser._id, orgId: campusOrg._id, role: 'moderator' },
    { userId: member1._id, orgId: campusOrg._id, role: 'member' },
    { userId: member2._id, orgId: campusOrg._id, role: 'member' },

    { userId: adminUser._id, orgId: officeOrg._id, role: 'admin' },
    { userId: modUser._id, orgId: officeOrg._id, role: 'moderator' },
    { userId: member1._id, orgId: officeOrg._id, role: 'member' },
    { userId: member2._id, orgId: officeOrg._id, role: 'member' },
  ];

  for (const m of membershipsData) {
    // Reset canonical demo roles on every seed so test activity cannot leave
    // the member persona promoted to moderator or admin.
    await Membership.findOneAndUpdate(
      { userId: m.userId, orgId: m.orgId },
      { $set: { role: m.role } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // 6. Ensure Sample Reports for Campus Org
  const campusReportsCount = await Report.countDocuments({ orgId: campusOrg._id });
  if (campusReportsCount === 0) {
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

    const lostHydroFlask = await Report.create({
      orgId: campusOrg._id,
      type: 'lost',
      status: 'open',
      reporterId: member1._id,
      category: 'bottles_umbrellas',
      title: 'Silver Hydro Flask Water Bottle',
      description: 'Lost my silver Hydro Flask 32oz with mountain sticker near cafeteria lunch area.',
      colors: ['Silver'],
      brand: 'Hydro Flask',
      location: 'cafeteria',
      locationNote: 'Cafeteria tables',
      occurredFrom: new Date(Date.now() - 3600000 * 6),
      occurredTo: new Date(Date.now() - 3600000 * 4),
      photo: { url: '', publicId: '' },
      expiresAt: new Date(Date.now() + 86400000 * 60),
    });

    const { runMatchingForReport } = await import('../src/services/matching/matching.service.js');
    await runMatchingForReport(lostHydroFlask, campusOrg);
  }

  // 7. Ensure Sample Reports for Office Org
  const officeReportsCount = await Report.countDocuments({ orgId: officeOrg._id });
  if (officeReportsCount === 0) {
    await Report.create([
      {
        orgId: officeOrg._id,
        type: 'found',
        status: 'published',
        reporterId: modUser._id,
        category: 'electronics',
        title: 'Apple 96W USB-C Power Adapter',
        description: 'Found plugged in under meeting room 4B whiteboard.',
        colors: ['White'],
        brand: 'Apple',
        location: 'meeting_rooms',
        locationNote: 'Under whiteboard',
        occurredFrom: new Date(Date.now() - 3600000 * 3),
        occurredTo: new Date(Date.now() - 3600000 * 3),
        photo: { url: '', publicId: '' },
        expiresAt: new Date(Date.now() + 86400000 * 60),
      },
      {
        orgId: officeOrg._id,
        type: 'found',
        status: 'published',
        reporterId: modUser._id,
        category: 'electronics',
        title: 'ThinkPad Universal USB-C Dock',
        description: 'Left on hot desk #18 in Engineering pod.',
        colors: ['Black'],
        brand: 'Lenovo',
        location: 'cubicles',
        locationNote: 'Desk 18',
        occurredFrom: new Date(Date.now() - 3600000 * 4),
        occurredTo: new Date(Date.now() - 3600000 * 4),
        photo: { url: '', publicId: '' },
        expiresAt: new Date(Date.now() + 86400000 * 60),
      },
      {
        orgId: officeOrg._id,
        type: 'found',
        status: 'pending_review',
        reporterId: member1._id,
        category: 'keys_badges',
        title: 'Corporate Access RFID Badge',
        description: 'Lanyard with employee badge found near 4th floor elevator lobby.',
        colors: ['Black', 'Blue'],
        location: 'reception',
        occurredFrom: new Date(Date.now() - 3600000 * 1),
        occurredTo: new Date(Date.now() - 3600000 * 1),
        photo: { url: '', publicId: '' },
        expiresAt: new Date(Date.now() + 86400000 * 60),
      },
    ]);
  }

  // 8. Ensure Sample Moderator Requests
  // 8a. Sam Chen for Campus
  const existingCampusReq = await ModeratorRequest.findOne({
    orgId: campusOrg._id,
    userId: member2._id,
  });
  if (!existingCampusReq) {
    await ModeratorRequest.create({
      orgId: campusOrg._id,
      userId: member2._id,
      reason: 'I work at the Campus Library help desk on weekdays and can help log and verify lost student IDs and laptops.',
      contactInfo: 'Ext 4091 / Library Desk',
      status: 'pending',
    });
  }

  // 8b. Alex Rivera for Office
  const existingOfficeReq = await ModeratorRequest.findOne({
    orgId: officeOrg._id,
    userId: member1._id,
  });
  if (!existingOfficeReq) {
    await ModeratorRequest.create({
      orgId: officeOrg._id,
      userId: member1._id,
      reason: 'Stationed at the 4th Floor Tech Tower reception and available to verify employee badges and custody handovers.',
      contactInfo: 'Desk Phone: Ext 104',
      status: 'pending',
    });
  }
}
