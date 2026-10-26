import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { Membership } from '../src/models/Membership.js';
import { Report } from '../src/models/Report.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Phase 3 Core Test Suite 3: Strict Tenant Isolation & Privacy by Obscurity', () => {
  let userA, tokenA;
  let userB, tokenB;
  let userBoth, tokenBoth;
  let orgA, orgB;
  let reportA, reportB;

  beforeAll(async () => {
    // 1. Create Users
    const resA = await request(app).post('/api/auth/signup').send({
      name: 'Campus User A',
      email: 'userA@campus.local',
      password: 'Password123!',
    });
    tokenA = resA.body.token;
    userA = resA.body.user;

    const resB = await request(app).post('/api/auth/signup').send({
      name: 'Office User B',
      email: 'userB@office.local',
      password: 'Password123!',
    });
    tokenB = resB.body.token;
    userB = resB.body.user;

    const resBoth = await request(app).post('/api/auth/signup').send({
      name: 'Dual Member',
      email: 'dual@shared.local',
      password: 'Password123!',
    });
    tokenBoth = resBoth.body.token;
    userBoth = resBoth.body.user;

    // 2. Create Orgs
    const createOrgA = await request(app)
      .post('/api/orgs')
      .set('Cookie', [`haven_token=${tokenA}`])
      .send({ name: 'Alpha Campus', slug: 'alpha-campus', templateKey: 'campus' });
    orgA = createOrgA.body.org;

    const createOrgB = await request(app)
      .post('/api/orgs')
      .set('Cookie', [`haven_token=${tokenB}`])
      .send({ name: 'Beta Office', slug: 'beta-office', templateKey: 'office' });
    orgB = createOrgB.body.org;

    // Dual user joins Org A only as member
    await Membership.create({ userId: userBoth.id, orgId: orgA._id, role: 'member' });

    // 3. Create Reports in Org A and Org B
    reportA = await Report.create({
      orgId: orgA._id,
      userId: userA.id,
      type: 'found',
      status: 'published',
      title: 'Blue Water Bottle at Library',
      category: 'bottles_umbrellas',
      location: 'library',
      occurredFrom: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    });

    reportB = await Report.create({
      orgId: orgB._id,
      userId: userB.id,
      type: 'found',
      status: 'published',
      title: 'Executive Laptop Charger in Boardroom',
      category: 'electronics',
      location: 'boardroom',
      occurredFrom: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    });
  });

  it('1. Non-member receives 404 (Privacy by Obscurity) when requesting an existing organization', async () => {
    // userA is NOT a member of beta-office
    const res = await request(app)
      .get(`/api/o/${orgB.slug}`)
      .set('Cookie', [`haven_token=${tokenA}`]);

    // Must return 404 Not Found, NEVER 403 Forbidden
    expect(res.status).toBe(404);
    expect(res.body.error?.message).toMatch(/not found/i);
  });

  it('2. Requesting a completely non-existent org slug returns 404', async () => {
    const res = await request(app)
      .get('/api/o/ghost-org-nonexistent')
      .set('Cookie', [`haven_token=${tokenA}`]);

    expect(res.status).toBe(404);
  });

  it('3. Org A member cannot fetch Org B reports even with direct report ID (404)', async () => {
    const res = await request(app)
      .get(`/api/o/${orgA.slug}/reports/${reportB._id}`)
      .set('Cookie', [`haven_token=${tokenA}`]);

    expect(res.status).toBe(404);
  });

  it('4. Multi-org member only sees records scoped to the current active org slug', async () => {
    // Dual user is member of Org A
    const resA = await request(app)
      .get(`/api/o/${orgA.slug}/reports/found`)
      .set('Cookie', [`haven_token=${tokenBoth}`]);

    expect(resA.status).toBe(200);
    const itemIds = resA.body.items.map((i) => i.id || i._id);
    expect(itemIds).toContain(reportA._id.toString());
    expect(itemIds).not.toContain(reportB._id.toString());

    // Dual user is NOT a member of Org B -> gets 404
    const resB = await request(app)
      .get(`/api/o/${orgB.slug}/reports/found`)
      .set('Cookie', [`haven_token=${tokenBoth}`]);

    expect(resB.status).toBe(404);
  });
});
