import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { hashSecret, normalizeSecretString, compareSecret } from '../src/utils/hmac.js';
import { evaluateAnswer } from '../src/services/claims/verify.js';
import { createClaim, verifyHandover } from '../src/services/claims/claim.service.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { Report } from '../src/models/Report.js';
import { Claim } from '../src/models/Claim.js';
import { AuditLog } from '../src/models/AuditLog.js';

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

describe('Phase 2 Day 7: Claims Engine, Verification & Concurrency Control', () => {
  describe('1. Dual Verification Evaluator (HMAC & Token Overlap)', () => {
    it('normalizes secret strings and computes consistent HMAC-SHA256 digests', () => {
      const inputA = ' AB-1234  ';
      const inputB = 'ab1234';
      expect(normalizeSecretString(inputA)).toBe('ab1234');
      expect(hashSecret(inputA)).toBe(hashSecret(inputB));
    });

    it('matches secret challenge via normalized HMAC-SHA256', async () => {
      const secret = 'ID-994821';
      const promptDef = {
        key: 'card_id',
        kind: 'secret',
        valueHash: hashSecret(secret),
      };

      const matchRes = await evaluateAnswer('  id-994821 ', promptDef);
      expect(matchRes).toBe('match');

      const noMatchRes = await evaluateAnswer('wrong-id', promptDef);
      expect(noMatchRes).toBe('no_match');
    });

    it('evaluates text token overlap: >=0.5 match, 0.2-0.5 needs_review, <0.2 no_match', async () => {
      const promptDef = {
        key: 'markings',
        kind: 'text',
        value: 'blue mountain sticker bottom corner scratch',
      };

      // Exact or high overlap (3/6 = 0.5 -> match)
      const highRes = await evaluateAnswer('blue mountain sticker', promptDef);
      expect(highRes).toBe('match');

      // Moderate overlap (2/6 = 0.33 -> needs_review)
      const modRes = await evaluateAnswer('mountain sticker luggage tag', promptDef);
      expect(modRes).toBe('needs_review');

      // Low/no overlap (0/6 = 0.0 -> no_match)
      const lowRes = await evaluateAnswer('completely unrelated red velvet case', promptDef);
      expect(lowRes).toBe('no_match');
    });
  });

  describe('2. Concurrency Control & Atomic Claim Lock (409 Conflict)', () => {
    let testOrg;
    let claimant1;
    let claimant2;
    let moderator;
    let foundReport;

    beforeAll(async () => {
      claimant1 = await User.create({
        name: 'Claimant Alice',
        email: 'alice@claimstest.edu',
        passwordHash: 'hash',
      });

      claimant2 = await User.create({
        name: 'Claimant Bob',
        email: 'bob@claimstest.edu',
        passwordHash: 'hash',
      });

      moderator = await User.create({
        name: 'Desk Moderator',
        email: 'mod@claimstest.edu',
        passwordHash: 'hash',
      });

      testOrg = await Organization.create({
        name: 'Claims Test Org',
        slug: 'claims-test-org',
        domain: 'claimstest.edu',
        createdBy: moderator._id,
        categories: [
          {
            key: 'electronics',
            label: 'Electronics',
            sensitive: false,
            autoApproveClaims: true,
          },
          {
            key: 'wallet_bags',
            label: 'Wallets',
            sensitive: true,
            autoApproveClaims: false,
            verificationPrompts: [
              { key: 'secret_code', label: 'Passcode hint', kind: 'secret' },
            ],
          },
        ],
        locations: [{ key: 'library', label: 'Library', zone: 'central' }],
        claimPolicy: {
          maxAttempts: 3,
          minMatchingDetails: 1,
        },
      });

      foundReport = await Report.create({
        orgId: testOrg._id,
        type: 'found',
        status: 'published',
        reporterId: moderator._id,
        category: 'electronics',
        title: 'Wireless Earbuds',
        location: 'library',
        occurredFrom: new Date(),
        occurredTo: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      });
    });

    it('rejects concurrent claim with 409 Conflict when item is already claiming', async () => {
      // Execute two simultaneous claims against the same published found report
      const results = await Promise.allSettled([
        createClaim(testOrg, claimant1, { foundId: foundReport._id }),
        createClaim(testOrg, claimant2, { foundId: foundReport._id }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      // Assert the rejected claim encountered 409 Conflict
      const err = rejected[0].reason;
      expect(err.statusCode || err.status).toBe(409);
      expect(err.code).toBe('ALREADY_CLAIMING');

      // Report status is atomically locked to claim_pending
      const updatedReport = await Report.findById(foundReport._id);
      expect(updatedReport.status).toBe('claim_pending');
    });
  });

  describe('3. Abuse Protection & Max Attempts Lockout', () => {
    let testOrg;
    let claimant;
    let targetReport;

    beforeAll(async () => {
      claimant = await User.create({
        name: 'Attempt Spammer',
        email: 'spammer@abuse.edu',
        passwordHash: 'hash',
      });

      testOrg = await Organization.create({
        name: 'Abuse Test Org',
        slug: 'abuse-test-org',
        domain: 'abuse.edu',
        createdBy: claimant._id,
        categories: [{ key: 'electronics', label: 'Electronics', sensitive: false }],
        locations: [{ key: 'library', label: 'Library' }],
        claimPolicy: { maxAttempts: 3 },
      });

      targetReport = await Report.create({
        orgId: testOrg._id,
        type: 'found',
        status: 'published',
        reporterId: claimant._id,
        category: 'electronics',
        title: 'Camera Lens',
        location: 'library',
        occurredFrom: new Date(),
        occurredTo: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      });
    });

    it('locks out user after reaching max claim attempts (429)', async () => {
      // Simulate 3 prior rejected claim attempts by this claimant on targetReport
      await Claim.create([
        {
          orgId: testOrg._id,
          foundId: targetReport._id,
          claimantId: claimant._id,
          status: 'rejected',
        },
        {
          orgId: testOrg._id,
          foundId: targetReport._id,
          claimantId: claimant._id,
          status: 'rejected',
        },
        {
          orgId: testOrg._id,
          foundId: targetReport._id,
          claimantId: claimant._id,
          status: 'rejected',
        },
      ]);

      // Attempt 4 should be rejected with 429 MAX_ATTEMPTS_EXCEEDED
      await expect(
        createClaim(testOrg, claimant, { foundId: targetReport._id })
      ).rejects.toThrow(/maximum allowed verification attempts/);
    });
  });

  describe('4. Desk Handover Terminal & Audit Logging', () => {
    let testOrg;
    let claimant;
    let moderator;
    let lostReport;
    let foundReport;
    let claim;

    beforeAll(async () => {
      claimant = await User.create({
        name: 'Verified Claimant',
        email: 'verified@handover.edu',
        passwordHash: 'hash',
      });

      moderator = await User.create({
        name: 'Handover Officer',
        email: 'officer@handover.edu',
        passwordHash: 'hash',
      });

      testOrg = await Organization.create({
        name: 'Handover Test Org',
        slug: 'handover-test-org',
        domain: 'handover.edu',
        createdBy: moderator._id,
        categories: [{ key: 'electronics', label: 'Electronics', sensitive: false }],
        locations: [{ key: 'library', label: 'Library' }],
      });

      lostReport = await Report.create({
        orgId: testOrg._id,
        type: 'lost',
        status: 'matched',
        reporterId: claimant._id,
        category: 'electronics',
        title: 'Lost Headphones',
        location: 'library',
        occurredFrom: new Date(),
        occurredTo: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      });

      foundReport = await Report.create({
        orgId: testOrg._id,
        type: 'found',
        status: 'claim_pending',
        reporterId: moderator._id,
        category: 'electronics',
        title: 'Found Headphones',
        location: 'library',
        occurredFrom: new Date(),
        occurredTo: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      });

      claim = await Claim.create({
        orgId: testOrg._id,
        foundId: foundReport._id,
        lostId: lostReport._id,
        claimantId: claimant._id,
        status: 'approved',
        handoverCode: '654321',
        handoverAttempts: 0,
      });
    });

    it('increments handover attempts on invalid code, and locks after 5 failed attempts', async () => {
      // 1-4 invalid attempts
      for (let i = 1; i <= 4; i++) {
        await expect(
          verifyHandover(testOrg._id, { claimId: claim._id, handoverCode: '000000' }, moderator, testOrg)
        ).rejects.toThrow(/Invalid code/);
      }

      const claimAfter4 = await Claim.findById(claim._id);
      expect(claimAfter4.handoverAttempts).toBe(4);

      // 5th invalid attempt should lock the claim (403 CODE_LOCKED) and release found report back to published
      await expect(
        verifyHandover(testOrg._id, { claimId: claim._id, handoverCode: '000000' }, moderator, testOrg)
      ).rejects.toThrow(/Handover code locked due to 5 failed attempts/);

      const lockedClaim = await Claim.findById(claim._id);
      expect(lockedClaim.status).toBe('rejected');

      const releasedReport = await Report.findById(foundReport._id);
      expect(releasedReport.status).toBe('published');

      // AuditLog entry for abuse lockout
      const lockAudit = await AuditLog.findOne({
        orgId: testOrg._id,
        action: 'HANDOVER_LOCKED_ABUSE',
      });
      expect(lockAudit).toBeDefined();
    });

    it('completes verified physical handover: claim collected, found handed_over, lost resolved, AuditLog created', async () => {
      // Reset claim and reports for successful handover verification
      await Report.findByIdAndUpdate(foundReport._id, { status: 'claim_pending' });
      await Report.findByIdAndUpdate(lostReport._id, { status: 'matched' });
      await Claim.findByIdAndUpdate(claim._id, {
        status: 'approved',
        handoverCode: '123456',
        handoverAttempts: 0,
      });

      const result = await verifyHandover(
        testOrg._id,
        { claimId: claim._id, handoverCode: '123456' },
        moderator,
        testOrg
      );

      expect(result.success).toBe(true);
      expect(result.claim.status).toBe('collected');

      const updatedFound = await Report.findById(foundReport._id);
      expect(updatedFound.status).toBe('handed_over');

      const updatedLost = await Report.findById(lostReport._id);
      expect(updatedLost.status).toBe('resolved');

      const auditEntry = await AuditLog.findOne({
        orgId: testOrg._id,
        action: 'HANDOVER_VERIFIED',
        targetId: claim._id,
      });
      expect(auditEntry).toBeDefined();
      expect(auditEntry.meta.handoverCode).toBe('123456');
    });
  });
});
