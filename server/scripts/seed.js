import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Membership } from '../src/models/Membership.js';
import { Report } from '../src/models/Report.js';
import { seedInternal } from './seedData.js';

async function seed() {
  console.log('[seed] Starting database seed...');
  await mongoose.connect(env.MONGODB_URI);

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Membership.deleteMany({}),
    Report.deleteMany({}),
  ]);
  console.log('[seed] Cleared existing database records.');

  await seedInternal();

  console.log('[seed] Seed complete. Demo users created:');
  console.log('       admin@haven.local (Password123!)');
  console.log('       mod@haven.local   (Password123!)');
  console.log('       alex@haven.local  (Password123!)');
  console.log('       sam@haven.local   (Password123!)');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] Seeding failed:', err);
  process.exit(1);
});
