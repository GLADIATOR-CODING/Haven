import { describe, it, expect } from 'vitest';
import { redactSensitiveText, parseQueryWithKeywords } from '../src/services/ai/keywordParse.js';
import { parseQuery } from '../src/services/ai/queryParser.service.js';

describe('Phase 3 Core Test Suite 6: AI Guardrails, PII Redaction & Deterministic Fallback', () => {
  const mockOrg = {
    slug: 'test-campus',
    aiEnabled: true,
    categories: [
      { key: 'electronics', label: 'Electronics & Gadgets', keywords: ['phone', 'laptop', 'macbook', 'charger'] },
      { key: 'bottles_umbrellas', label: 'Bottles & Umbrellas', keywords: ['bottle', 'flask', 'hydro', 'umbrella'] },
      { key: 'keys', label: 'Keys & Cards', keywords: ['keys', 'keychain', 'card'] },
    ],
    locations: [
      { key: 'library', label: 'Central Library', zone: 'central' },
      { key: 'cafeteria', label: 'Main Cafeteria', zone: 'central' },
      { key: 'gym', label: 'Sports Complex', zone: 'north' },
    ],
  };

  describe('1. PII Redaction Pipeline', () => {
    it('redacts email addresses before LLM invocation', () => {
      const input = 'I lost my phone. Contact me at john.doe@university.edu please.';
      const redacted = redactSensitiveText(input);
      expect(redacted).not.toContain('john.doe@university.edu');
      expect(redacted).toContain('[REDACTED_EMAIL]');
    });

    it('redacts phone numbers and 10+ digit sequences (card/account numbers)', () => {
      const input = 'Call 987-654-3210 or 123456789012 if found';
      const redacted = redactSensitiveText(input);
      expect(redacted).not.toContain('987-654-3210');
      expect(redacted).not.toContain('123456789012');
      expect(redacted).toMatch(/\[REDACTED_PHONE\]|\[REDACTED_NUMBER\]/);
    });

    it('redacts URLs and web links', () => {
      const input = 'Picture of the item is at https://example.com/photos/my-item.jpg';
      const redacted = redactSensitiveText(input);
      expect(redacted).not.toContain('https://example.com');
      expect(redacted).toContain('[REDACTED_URL]');
    });
  });

  describe('2. Deterministic Keyword Fallback (keywordParse)', () => {
    it('correctly extracts category, location, and color from plain sentences', () => {
      const sentence = 'I forgot my blue water bottle at the Central Library yesterday afternoon';
      const result = parseQueryWithKeywords(sentence, mockOrg);

      expect(result.category).toBe('bottles_umbrellas');
      expect(result.location).toBe('library');
      expect(result.colors).toContain('Blue');
      expect(result.timeChip).toBe('Yesterday');
    });

    it('extracts known brands when present', () => {
      const sentence = 'Lost my black Apple iPhone near the cafeteria';
      const result = parseQueryWithKeywords(sentence, mockOrg);

      expect(result.category).toBe('electronics');
      expect(result.location).toBe('cafeteria');
      expect(result.brand).toBe('Apple');
      expect(result.colors).toContain('Black');
    });
  });

  describe('3. AI Service Graceful Fallback & aiEnabled: false Guarantee', () => {
    it('gracefully degrades to keyword parser when aiEnabled is false without throwing', async () => {
      const orgWithAiDisabled = { ...mockOrg, aiEnabled: false };
      const sentence = 'Left my Hydro Flask in the gym this morning';

      const parsed = await parseQuery(sentence, orgWithAiDisabled);

      expect(parsed).toBeDefined();
      expect(parsed.category).toBe('bottles_umbrellas');
      expect(parsed.location).toBe('gym');
    });

    it('operates reliably on empty or gibberish input without crashing', async () => {
      const emptyResult = await parseQuery('', mockOrg);
      expect(emptyResult).toBeDefined();

      const gibberishResult = await parseQuery('asdkfjhqwerty1234', mockOrg);
      expect(gibberishResult).toBeDefined();
    });
  });
});
