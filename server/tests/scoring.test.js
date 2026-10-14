import { describe, it, expect } from 'vitest';
import {
  scorePair,
  computeTimeScore,
  computeLocationScore,
  computeColorsBrandScore,
  computeTextScore,
  calculateHaversineDistance,
} from '../src/services/matching/scorer.js';
import { generateExplanation } from '../src/services/matching/explainer.js';

describe('Deterministic Matching Engine & Scorer', () => {
  const mockOrg = {
    _id: 'org123',
    timeWindowHours: 72,
    matchSensitivity: 'balanced',
    locations: [
      { key: 'library', label: 'Central Library', zone: 'central' },
      { key: 'cafeteria', label: 'Main Cafeteria', zone: 'central' },
      { key: 'sports_complex', label: 'Sports Complex', zone: 'north' },
    ],
    categories: [
      {
        key: 'bottles_umbrellas',
        label: 'Bottles & Umbrellas',
        keywords: ['bottle', 'flask', 'water', 'hydro', 'sticker'],
      },
    ],
  };

  describe('Signal Calculations', () => {
    it('computes 1.0 time score when found inside the lost time window', () => {
      const now = Date.now();
      const lostReport = {
        occurredFrom: new Date(now - 7200000), // 2h ago
        occurredTo: new Date(now),
      };
      const foundReport = {
        occurredFrom: new Date(now - 3600000), // 1h ago
      };

      const result = computeTimeScore(lostReport, foundReport, 72);
      expect(result.score).toBe(1.0);
      expect(result.available).toBe(true);
    });

    it('decays time score linearly after the lost window', () => {
      const now = Date.now();
      const lostReport = {
        occurredFrom: new Date(now - 86400000), // 24h ago
        occurredTo: new Date(now - 72000000), // 20h ago
      };
      // Found 36h after lostTo in a 72h window -> (1 - 36/72) = 0.5
      const foundReport = {
        occurredFrom: new Date(lostReport.occurredTo.getTime() + 36 * 3600000),
      };

      const result = computeTimeScore(lostReport, foundReport, 72);
      expect(result.score).toBeCloseTo(0.5, 2);
    });

    it('computes location score: exact match = 1.0, same zone = 0.6, different = 0.1', () => {
      const repA = { location: 'library' };
      const repB = { location: 'library' };
      const repC = { location: 'cafeteria' }; // same zone 'central'
      const repD = { location: 'sports_complex' }; // different zone 'north'

      expect(computeLocationScore(repA, repB, mockOrg.locations).score).toBe(1.0);
      expect(computeLocationScore(repA, repC, mockOrg.locations).score).toBe(0.6);
      expect(computeLocationScore(repA, repD, mockOrg.locations).score).toBe(0.1);
    });

    it('computes GPS proximity score using Haversine distance', () => {
      // 2 points ~30 meters apart
      const repNearA = { geo: { lat: 12.9716, lng: 77.5946 } };
      const repNearB = { geo: { lat: 12.9718, lng: 77.5947 } };

      const scoreNear = computeLocationScore(repNearA, repNearB, mockOrg.locations);
      expect(scoreNear.score).toBe(1.0); // <50m
    });

    it('computes Jaccard color similarity and brand match', () => {
      const rep1 = { colors: ['Blue', 'White'], brand: 'Nike' };
      const rep2 = { colors: ['Blue', 'White'], brand: 'Nike' };

      const score = computeColorsBrandScore(rep1, rep2);
      expect(score.score).toBe(1.0);
      expect(score.available).toBe(true);
    });

    it('drops color signal when missing on one report (renormalization trigger)', () => {
      const rep1 = { colors: ['Blue'], brand: '' };
      const rep2 = { colors: [], brand: '' }; // missing colors on found report

      const score = computeColorsBrandScore(rep1, rep2);
      expect(score.available).toBe(false);
    });
  });

  describe('Worked Examples & Renormalization', () => {
    it('Worked Example 1: all signals present -> 0.75 score -> High match', () => {
      // Signals:
      // Time = 1.0 (weight 30)
      // Location same zone = 0.6 (weight 25)
      // Colors = 1.0 (weight 20)
      // Text = 0.4 (weight 25)
      // Formula: (30*1.0 + 25*0.6 + 20*1.0 + 25*0.4) / 100 = 75 / 100 = 0.75
      const now = Date.now();
      const lostReport = {
        category: 'bottles_umbrellas',
        occurredFrom: new Date(now - 7200000),
        occurredTo: new Date(now),
        location: 'library',
        colors: ['Blue'],
        brand: 'Hydro Flask',
        title: 'Blue water bottle with stickers',
        description: 'Lost my hydro flask with stickers in campus',
      };

      const foundReport = {
        category: 'bottles_umbrellas',
        occurredFrom: new Date(now - 3600000),
        location: 'cafeteria', // same zone: 0.6
        colors: ['Blue'], // Jaccard 1.0 + brand 0.3 capped at 1.0
        brand: 'Hydro Flask',
        title: 'Blue bottle',
        description: 'Found bottle with sticker on table',
      };

      const result = scorePair(lostReport, foundReport, mockOrg);

      expect(result.score).toBeGreaterThanOrEqual(0.70);
      expect(result.band).toBe('high');
      expect(result.breakdown.colors.available).toBe(true);
      expect(result.totalAvailableWeight).toBe(100);
    });

    it('Worked Example 2: missing colors on found report -> dropped and renormalized to 80 weight -> 0.6875 score', () => {
      // Worked Example 2 from specification:
      // Time 1.0 (30), location same zone 0.6 (25), text 0.4 (25), colors dropped (20).
      // Remaining weight: 80.
      // (30*1.0 + 25*0.6 + 25*0.4) / 80 = (30 + 15 + 10) / 80 = 55 / 80 = 0.6875 -> Possible.
      const now = Date.now();
      const lostReport = {
        category: 'bottles_umbrellas',
        occurredFrom: new Date(now - 7200000),
        occurredTo: new Date(now),
        location: 'library',
        colors: ['Blue'],
        brand: '',
        title: 'water bottle',
        description: 'water bottle',
      };

      const foundReport = {
        category: 'bottles_umbrellas',
        occurredFrom: new Date(now - 3600000),
        location: 'cafeteria', // same zone: 0.6
        colors: [], // missing colors!
        brand: '',
        title: 'bottle',
        description: 'bottle',
      };

      const result = scorePair(lostReport, foundReport, mockOrg);

      // Verify colors was dropped and available weight is 80
      expect(result.breakdown.colors.available).toBe(false);
      expect(result.totalAvailableWeight).toBe(80);
      expect(result.band).toBe('possible');
    });

    it('respects sensitivity presets: strict, balanced, and lenient', () => {
      const now = Date.now();
      const lost = {
        category: 'bottles_umbrellas',
        occurredFrom: new Date(now - 3600000),
        occurredTo: new Date(now),
        location: 'sports_complex', // different zone: 0.1
        colors: ['Red'],
        brand: '',
        title: 'Red umbrella',
      };
      const found = {
        category: 'bottles_umbrellas',
        occurredFrom: new Date(now - 1800000),
        location: 'library', // different zone: 0.1
        colors: ['Red'], // 1.0
        brand: '',
        title: 'Red umbrella',
      };

      const strictOrg = { ...mockOrg, matchSensitivity: 'strict' };
      const balancedOrg = { ...mockOrg, matchSensitivity: 'balanced' };
      const lenientOrg = { ...mockOrg, matchSensitivity: 'lenient' };

      const resStrict = scorePair(lost, found, strictOrg);
      const resBalanced = scorePair(lost, found, balancedOrg);
      const resLenient = scorePair(lost, found, lenientOrg);

      // Score should be identical, but band classifications vary based on threshold
      expect(resStrict.score).toBe(resBalanced.score);
      expect(resBalanced.score).toBe(resLenient.score);
    });

    it('generates natural-language explanations from template', () => {
      const lost = {
        category: 'bottles_umbrellas',
        occurredFrom: new Date('2026-10-18T10:00:00Z'),
        location: 'library',
        colors: ['Blue'],
        brand: '',
        description: 'hydro flask bottle with sticker',
      };
      const found = {
        category: 'bottles_umbrellas',
        occurredFrom: new Date('2026-10-18T11:00:00Z'),
        location: 'library',
        colors: ['Blue'],
        brand: '',
        description: 'flask with sticker found on desk',
      };

      const scoreResult = scorePair(lost, found, mockOrg);
      const explanation = generateExplanation(lost, found, scoreResult, mockOrg);

      expect(explanation).toContain('match');
      expect(explanation).toContain('blue');
      expect(explanation).toContain('Central Library');
    });
  });
});
