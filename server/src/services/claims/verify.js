import { hashSecret } from '../../utils/hmac.js';
import { env } from '../../config/env.js';

/**
 * Tokenize string into lowercased alphanumeric words.
 */
function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1);
}

/**
 * Evaluate single verification answer against finder's private details.
 *
 * Kinds:
 * - secret: Normalized HMAC-SHA256 match (strictly deterministic, zero-knowledge).
 * - text: Token-overlap similarity with Gemini semantic verification fallback.
 */
export async function evaluateAnswer(answerValue, privateDetailPrompt) {
  if (!answerValue || !privateDetailPrompt) {
    return 'no_match';
  }

  const kind = privateDetailPrompt.kind || 'text';

  // 1. Secret verification: Normalized HMAC hash (Strictly deterministic & zero-knowledge)
  if (kind === 'secret') {
    const claimantHash = hashSecret(answerValue);
    if (claimantHash && privateDetailPrompt.valueHash && claimantHash === privateDetailPrompt.valueHash) {
      return 'match';
    }
    return 'no_match';
  }

  // 2. Text verification: Base token overlap
  const finderTokens = tokenize(privateDetailPrompt.value || '');
  const claimantTokens = tokenize(answerValue);

  if (finderTokens.length === 0 || claimantTokens.length === 0) {
    return 'needs_review';
  }

  const finderSet = new Set(finderTokens);
  const common = claimantTokens.filter((t) => finderSet.has(t));
  const overlapRatio = common.length / Math.max(finderTokens.length, 1);

  if (overlapRatio >= 0.5) {
    return 'match';
  }

  // 3. Gemini Semantic Verification (if different phrasing or synonyms used)
  const geminiKey = (env.GEMINI_API_KEY || env.AI_API_KEY || '').trim();
  if (geminiKey && privateDetailPrompt.value && answerValue) {
    try {
      const prompt = `You are an ownership verification evaluator for a physical space custody desk.
Determine if the claimant's answer describes the same physical feature, engraving, marking, or detail as the finder's record.
Consider phrasing differences and synonyms.

Finder's Record: "${privateDetailPrompt.value}"
Claimant's Answer: "${answerValue}"

Output strictly JSON:
{
  "verdict": "match" | "needs_review" | "no_match",
  "confidence": number (0.0 to 1.0),
  "rationale": string
}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.verdict === 'match' && parsed.confidence >= 0.70) {
            return 'match';
          }
          if (parsed.verdict === 'needs_review' || (parsed.verdict === 'match' && parsed.confidence < 0.70)) {
            return 'needs_review';
          }
        }
      }
    } catch (err) {
      // Fallback seamlessly to deterministic overlap
    }
  }

  if (overlapRatio >= 0.2) {
    return 'needs_review';
  }
  return 'no_match';
}

/**
 * Evaluate all submitted answers against finder's private verification details.
 */
export async function evaluateClaimAnswers(submittedAnswers = [], privateDetails = []) {
  const checkResults = [];
  let matchCount = 0;

  for (const ans of submittedAnswers) {
    const promptDef = privateDetails.find((p) => p.key === ans.key);
    const result = await evaluateAnswer(ans.value, promptDef);

    checkResults.push({
      key: ans.key,
      result,
    });

    if (result === 'match') {
      matchCount++;
    }
  }

  return {
    autoCheck: checkResults,
    matchCount,
  };
}
