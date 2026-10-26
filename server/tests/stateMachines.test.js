import { describe, it, expect } from 'vitest';
import {
  canTransitionReport,
  validateReportTransition,
  canTransitionClaim,
  validateClaimTransition,
} from '../src/services/reports/stateMachine.js';
import { ApiError } from '../src/utils/ApiError.js';

describe('Phase 3 Core Test Suite 2: State Machines & Transition Guardrails', () => {
  describe('1. Found Report State Machine', () => {
    it('allows legal found report transitions', () => {
      // pending_review -> published
      expect(canTransitionReport('found', 'pending_review', 'published')).toBe(true);
      expect(() => validateReportTransition('found', 'pending_review', 'published')).not.toThrow();

      // published -> claim_pending
      expect(canTransitionReport('found', 'published', 'claim_pending')).toBe(true);

      // claim_pending -> handed_over
      expect(canTransitionReport('found', 'claim_pending', 'handed_over')).toBe(true);

      // claim_pending -> published (if claim rejected or cancelled)
      expect(canTransitionReport('found', 'claim_pending', 'published')).toBe(true);
    });

    it('rejects illegal found report transitions with 409 Conflict', () => {
      // Terminal state: handed_over cannot go back to published
      expect(canTransitionReport('found', 'handed_over', 'published')).toBe(false);
      expect(() => validateReportTransition('found', 'handed_over', 'published')).toThrowError(
        expect.objectContaining({ statusCode: 409, code: 'ILLEGAL_TRANSITION' })
      );

      // Cannot jump from pending_review directly to handed_over
      expect(canTransitionReport('found', 'pending_review', 'handed_over')).toBe(false);
      expect(() => validateReportTransition('found', 'pending_review', 'handed_over')).toThrowError(
        expect.objectContaining({ statusCode: 409 })
      );

      // Terminal state: rejected cannot go to published
      expect(canTransitionReport('found', 'rejected', 'published')).toBe(false);
      expect(() => validateReportTransition('found', 'rejected', 'published')).toThrowError(
        expect.objectContaining({ statusCode: 409 })
      );
    });
  });

  describe('2. Lost Report State Machine', () => {
    it('allows legal lost report transitions', () => {
      // open -> matched
      expect(canTransitionReport('lost', 'open', 'matched')).toBe(true);

      // matched -> resolved
      expect(canTransitionReport('lost', 'matched', 'resolved')).toBe(true);

      // open -> resolved
      expect(canTransitionReport('lost', 'open', 'resolved')).toBe(true);
    });

    it('rejects illegal lost report transitions with 409 Conflict', () => {
      // Terminal state: resolved cannot go back to open
      expect(canTransitionReport('lost', 'resolved', 'open')).toBe(false);
      expect(() => validateReportTransition('lost', 'resolved', 'open')).toThrowError(
        expect.objectContaining({ statusCode: 409 })
      );

      // Terminal state: expired cannot go to matched
      expect(canTransitionReport('lost', 'expired', 'matched')).toBe(false);
      expect(() => validateReportTransition('lost', 'expired', 'matched')).toThrowError(
        expect.objectContaining({ statusCode: 409 })
      );
    });
  });

  describe('3. Claim State Machine', () => {
    it('allows legal claim lifecycle transitions', () => {
      // submitted -> approved
      expect(canTransitionClaim('submitted', 'approved')).toBe(true);

      // submitted -> needs_info
      expect(canTransitionClaim('submitted', 'needs_info')).toBe(true);

      // approved -> collected
      expect(canTransitionClaim('approved', 'collected')).toBe(true);

      // approved -> rejected (e.g. lockout or fraud detected)
      expect(canTransitionClaim('approved', 'rejected')).toBe(true);
    });

    it('rejects illegal claim transitions with 409 Conflict', () => {
      // Terminal state: collected cannot transition back to submitted
      expect(canTransitionClaim('collected', 'submitted')).toBe(false);
      expect(() => validateClaimTransition('collected', 'submitted')).toThrowError(
        expect.objectContaining({ statusCode: 409, code: 'ILLEGAL_TRANSITION' })
      );

      // Terminal state: rejected cannot transition to collected
      expect(canTransitionClaim('rejected', 'collected')).toBe(false);
      expect(() => validateClaimTransition('rejected', 'collected')).toThrowError(
        expect.objectContaining({ statusCode: 409 })
      );

      // Cannot jump from needs_info directly to collected
      expect(canTransitionClaim('needs_info', 'collected')).toBe(false);
      expect(() => validateClaimTransition('needs_info', 'collected')).toThrowError(
        expect.objectContaining({ statusCode: 409 })
      );
    });
  });
});
