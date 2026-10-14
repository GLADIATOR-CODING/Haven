import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';

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

describe('Phase 1 Part 1: Health, Auth & Tenant Isolation', () => {
  let adminToken = '';
  let memberToken = '';
  let nonMemberToken = '';
  let orgSlug = '';
  let inviteCode = '';

  it('1. GET /api/health should respond with 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('2. POST /api/auth/signup should create users and set cookies', async () => {
    // Admin user
    const resAdmin = await request(app).post('/api/auth/signup').send({
      name: 'Test Admin',
      email: 'admin@test.local',
      password: 'Password123!',
    });
    expect(resAdmin.status).toBe(201);
    expect(resAdmin.body.user.email).toBe('admin@test.local');
    adminToken = resAdmin.body.token;

    // Member user
    const resMember = await request(app).post('/api/auth/signup').send({
      name: 'Test Member',
      email: 'member@test.local',
      password: 'Password123!',
    });
    expect(resMember.status).toBe(201);
    memberToken = resMember.body.token;

    // Non-member user
    const resNonMember = await request(app).post('/api/auth/signup').send({
      name: 'Non Member',
      email: 'outsider@test.local',
      password: 'Password123!',
    });
    expect(resNonMember.status).toBe(201);
    nonMemberToken = resNonMember.body.token;
  });

  it('3. POST /api/orgs creates an org from template with admin membership', async () => {
    const res = await request(app)
      .post('/api/orgs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Campus',
        templateKey: 'campus',
        handoverInstructions: 'Front desk',
      });

    expect(res.status).toBe(201);
    expect(res.body.org.name).toBe('Test Campus');
    expect(res.body.org.categories.length).toBeGreaterThan(0);
    expect(res.body.membership.role).toBe('admin');

    orgSlug = res.body.org.slug;
    inviteCode = res.body.org.join.code;
    expect(inviteCode).toBeDefined();
  });

  it('4. POST /api/orgs/join allows second user to join as member', async () => {
    const res = await request(app)
      .post('/api/orgs/join')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ slug: orgSlug });

    expect(res.status).toBe(200);
    expect(res.body.membership.role).toBe('member');
  });

  it('5. GET /api/o/:slug returns 200 for active members', async () => {
    const res = await request(app)
      .get(`/api/o/${orgSlug}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.org.slug).toBe(orgSlug);
    expect(res.body.currentRole).toBe('member');
  });

  it('6. Tenant Isolation: GET /api/o/:slug returns 404 for non-members', async () => {
    const res = await request(app)
      .get(`/api/o/${orgSlug}`)
      .set('Authorization', `Bearer ${nonMemberToken}`);

    // Must return 404 (NEVER 403) to prevent leaking tenant existence
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('7. Role Guard: PATCH /api/o/:slug fails with 403 for regular member and succeeds for admin', async () => {
    // Member tries to update settings
    const resMember = await request(app)
      .patch(`/api/o/${orgSlug}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hacked Campus' });

    expect(resMember.status).toBe(403);
    expect(resMember.body.error.code).toBe('FORBIDDEN');

    // Admin updates settings
    const resAdmin = await request(app)
      .patch(`/api/o/${orgSlug}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ handoverInstructions: 'Updated Gate 2 Desk' });

    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.org.handoverInstructions).toBe('Updated Gate 2 Desk');
  });

  it('8. POST /api/o/:slug/invite/rotate generates a fresh code', async () => {
    const res = await request(app)
      .post(`/api/o/${orgSlug}/invite/rotate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBeDefined();
    expect(res.body.code).not.toBe(inviteCode);
  });
});
