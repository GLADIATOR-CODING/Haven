import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { canTransitionReport, validateReportTransition } from '../src/services/reports/stateMachine.js';
import { publicView } from '../src/services/reports/serializer.js';

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

describe('Phase 1 Part 2: Found Report Domain, State Machine & Privacy Serialization', () => {
  let adminToken = '';
  let memberToken = '';
  let orgSlug = '';
  let nonSensitiveFoundId = '';
  let sensitiveFoundId = '';

  it('1. Setup user and organization for testing', async () => {
    // Admin
    const resAdmin = await request(app).post('/api/auth/signup').send({
      name: 'Campus Lead',
      email: 'lead@campus.local',
      password: 'Password123!',
    });
    adminToken = resAdmin.body.token;

    // Member
    const resMember = await request(app).post('/api/auth/signup').send({
      name: 'Student Finder',
      email: 'finder@campus.local',
      password: 'Password123!',
    });
    memberToken = resMember.body.token;

    // Create Campus Org
    const resOrg = await request(app)
      .post('/api/orgs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Report Test Campus',
        templateKey: 'campus',
      });
    orgSlug = resOrg.body.org.slug;

    // Join Org as member
    await request(app)
      .post('/api/orgs/join')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ code: resOrg.body.org.join.code });
  });

  it('2. Create Found Report in regular category publishes immediately', async () => {
    const res = await request(app)
      .post(`/api/o/${orgSlug}/reports`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        type: 'found',
        category: 'electronics',
        title: 'Found blue headphones',
        description: 'Found near reading desk 4',
        colors: ['blue', 'black'],
        location: 'library',
        occurredFrom: new Date().toISOString(),
        occurredTo: new Date().toISOString(),
        privateDetailsInput: [
          { key: 'lock_screen', kind: 'text', value: 'Cat sticker on case' },
          { key: 'passcode_hint', kind: 'secret', value: 'SN-987654321' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('published');
    expect(res.body.category).toBe('electronics');
    // Privacy guarantee: privateDetails MUST NOT be in member response
    expect(res.body.privateDetails).toBeUndefined();
    nonSensitiveFoundId = res.body.id;
  });

  it('3. Create Found Report in SENSITIVE category sets pending_review and masks photo', async () => {
    const res = await request(app)
      .post(`/api/o/${orgSlug}/reports`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        type: 'found',
        category: 'id_card', // Marked sensitive in campus.json!
        title: 'Student ID card found',
        location: 'cafeteria',
        occurredFrom: new Date().toISOString(),
        occurredTo: new Date().toISOString(),
        privateDetailsInput: [
          { key: 'full_name', kind: 'text', value: 'Jane Doe' },
          { key: 'id_number', kind: 'secret', value: 'CS-2026-999' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending_review');
    expect(res.body.photoMasked).toBe(true);
    expect(res.body.photo.url).toBe('');
    expect(res.body.privateDetails).toBeUndefined();
    sensitiveFoundId = res.body.id;
  });

  it('4. GET /api/o/:slug/reports/mine returns sanitized user reports', async () => {
    const res = await request(app)
      .get(`/api/o/${orgSlug}/reports/mine`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.reports.length).toBe(2);
    for (const r of res.body.reports) {
      expect(r.privateDetails).toBeUndefined();
    }
  });

  it('5. GET /api/o/:slug/reports/found returns only published items', async () => {
    const res = await request(app)
      .get(`/api/o/${orgSlug}/reports/found`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    // Should include electronics (published), but NOT id_card (pending_review)
    const ids = res.body.reports.map((r) => r.id);
    expect(ids).toContain(nonSensitiveFoundId);
    expect(ids).not.toContain(sensitiveFoundId);
  });

  it('6. State Machine: validates legal transitions and rejects illegal transitions with 409', () => {
    // Legal transitions
    expect(canTransitionReport('found', 'pending_review', 'published')).toBe(true);
    expect(canTransitionReport('found', 'published', 'claim_pending')).toBe(true);
    expect(canTransitionReport('found', 'claim_pending', 'handed_over')).toBe(true);
    expect(canTransitionReport('found', 'claim_pending', 'published')).toBe(true); // claim rejected

    // Illegal transitions
    expect(canTransitionReport('found', 'pending_review', 'handed_over')).toBe(false);
    expect(canTransitionReport('found', 'handed_over', 'published')).toBe(false);
    expect(() => validateReportTransition('found', 'handed_over', 'published')).toThrowError();
  });

  it('7. Serialization Defense-in-Depth: publicView strips private details even if present on object', () => {
    const fakeRawDoc = {
      _id: '123',
      title: 'Secret Bottle',
      privateDetails: [{ key: 'serial', value: '123456', valueHash: 'abcdef' }],
    };

    const sanitized = publicView(fakeRawDoc);
    expect(sanitized.privateDetails).toBeUndefined();
  });
});
