/**
 * Scorer: Deterministic weighted matching engine with missing-data renormalization.
 * Includes optional Gemini semantic description similarity boost.
 *
 * Signals:
 * 1. Time (weight 30)
 * 2. Location (weight 25)
 * 3. Colors & Brand (weight 20)
 * 4. Text Overlap (weight 25)
 *
 * Missing-Data Renormalization Rule:
 * finalScore = (Σ weight_i * signal_i) / (Σ weight_i of available signals)
 */
import { env } from '../../config/env.js';


const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'i', 'my', 'me', 'lost', 'found',
  'item', 'please', 'someone', 'here', 'there', 'this', 'that',
]);

const SENSITIVITY_THRESHOLDS = {
  strict: { hideBelow: 0.60, highAbove: 0.80 },
  balanced: { hideBelow: 0.45, highAbove: 0.75 },
  lenient: { hideBelow: 0.35, highAbove: 0.70 },
};

/**
 * Calculate Haversine distance in meters between two lat/lng coordinates.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 1. Time Signal (weight 30)
 * Inside lost window: 1.0
 * Found after window: linear decay to 0 over timeWindowHours
 * Found before window: 0.0
 */
export function computeTimeScore(lostReport, foundReport, timeWindowHours = 72) {
  const lostFrom = new Date(lostReport.occurredFrom).getTime();
  const lostTo = new Date(lostReport.occurredTo || lostReport.occurredFrom).getTime();
  const foundTime = new Date(foundReport.occurredFrom).getTime();

  if (isNaN(lostFrom) || isNaN(foundTime)) {
    return { score: 0, available: false, raw: 'Time invalid' };
  }

  // Inside the lost time window
  if (foundTime >= lostFrom && foundTime <= lostTo) {
    return { score: 1.0, available: true, raw: 'Inside time window' };
  }

  // After the window: linear decay over timeWindowHours
  if (foundTime > lostTo) {
    const elapsedMs = foundTime - lostTo;
    const windowMs = timeWindowHours * 3600000;
    const decayed = Math.max(0, 1 - elapsedMs / windowMs);
    const hours = Math.round(elapsedMs / 3600000);
    return {
      score: Math.round(decayed * 1000) / 1000,
      available: true,
      raw: `Found ${hours}h after window`,
    };
  }

  // Before the window
  return { score: 0.0, available: true, raw: 'Found before lost window' };
}

/**
 * 2. Location Signal (weight 25)
 * GPS radial proximity (<50m = 1.0, <200m = 0.8, <500m = 0.5)
 * Location string exact match: 1.0
 * Same zone match: 0.6
 * Different zone / location: 0.1
 */
export function computeLocationScore(lostReport, foundReport, orgLocations = []) {
  const hasGpsLost = lostReport.geo?.lat != null && lostReport.geo?.lng != null;
  const hasGpsFound = foundReport.geo?.lat != null && foundReport.geo?.lng != null;

  if (hasGpsLost && hasGpsFound) {
    const distanceMeters = calculateHaversineDistance(
      lostReport.geo.lat,
      lostReport.geo.lng,
      foundReport.geo.lat,
      foundReport.geo.lng
    );

    if (distanceMeters < 50) {
      return { score: 1.0, available: true, raw: `GPS proximity (<50m: ${Math.round(distanceMeters)}m)` };
    }
    if (distanceMeters < 200) {
      return { score: 0.8, available: true, raw: `GPS proximity (<200m: ${Math.round(distanceMeters)}m)` };
    }
    if (distanceMeters < 500) {
      return { score: 0.5, available: true, raw: `GPS proximity (<500m: ${Math.round(distanceMeters)}m)` };
    }
    return { score: 0.1, available: true, raw: `GPS distance: ${Math.round(distanceMeters)}m` };
  }

  const locLost = lostReport.location;
  const locFound = foundReport.location;

  if (!locLost && !locFound) {
    return { score: 0.1, available: false, raw: 'No location provided' };
  }

  if (locLost && locFound && locLost === locFound) {
    return { score: 1.0, available: true, raw: 'Exact location match' };
  }

  // Zone check
  const l1 = Array.isArray(orgLocations) ? orgLocations.find((l) => l.key === locLost) : null;
  const l2 = Array.isArray(orgLocations) ? orgLocations.find((l) => l.key === locFound) : null;

  if (l1?.zone && l2?.zone && l1.zone === l2.zone) {
    return { score: 0.6, available: true, raw: `Same zone (${l1.zone})` };
  }

  return { score: 0.1, available: true, raw: 'Different location/zone' };
}

/**
 * 3. Colors and Brand Signal (weight 20)
 * Jaccard similarity of color sets + brand match bonus (capped at 1.0).
 * If neither report has colors or brand, or one side is completely missing colors/brand,
 * drop and renormalize!
 */
export function computeColorsBrandScore(lostReport, foundReport) {
  const colors1 = (lostReport.colors || []).map((c) => c.toLowerCase().trim()).filter(Boolean);
  const colors2 = (foundReport.colors || []).map((c) => c.toLowerCase().trim()).filter(Boolean);
  const brand1 = (lostReport.brand || '').toLowerCase().trim();
  const brand2 = (foundReport.brand || '').toLowerCase().trim();

  const hasData1 = colors1.length > 0 || !!brand1;
  const hasData2 = colors2.length > 0 || !!brand2;

  // Missing data rule: if either side has no colors and no brand, drop this signal!
  if (!hasData1 || !hasData2) {
    return { score: 0, available: false, raw: 'Colors/Brand missing on one or both reports' };
  }

  let colorScore = 0;
  if (colors1.length > 0 && colors2.length > 0) {
    const intersection = colors1.filter((c) => colors2.includes(c)).length;
    const union = new Set([...colors1, ...colors2]).size;
    colorScore = union > 0 ? intersection / union : 0;
  }

  let brandBonus = 0;
  let brandMatched = false;
  if (brand1 && brand2) {
    if (brand1 === brand2 || brand1.includes(brand2) || brand2.includes(brand1)) {
      brandBonus = 0.3;
      brandMatched = true;
    }
  }

  // If colors were not specified but brand matches
  let finalScore = colorScore;
  if (colors1.length === 0 || colors2.length === 0) {
    if (brandMatched) {
      finalScore = 1.0;
    }
  } else {
    finalScore = Math.min(1.0, colorScore + brandBonus);
  }

  return {
    score: Math.round(finalScore * 1000) / 1000,
    available: true,
    raw: `Color overlap: ${Math.round(colorScore * 100)}%${brandMatched ? ' + brand match' : ''}`,
  };
}

/**
 * Helper: Tokenize text, remove punctuation, lower case, remove stop words.
 */
function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Helper: Generate word bigrams from token list.
 */
function getBigrams(tokens) {
  const bigrams = new Set();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

/**
 * 4. Text Overlap Signal (weight 25)
 * Token overlap combined with bigram title & description overlap.
 */
export function computeTextScore(lostReport, foundReport, categoryKeywords = []) {
  const text1 = `${lostReport.title || ''} ${lostReport.description || ''} ${lostReport.locationNote || ''}`;
  const text2 = `${foundReport.title || ''} ${foundReport.description || ''} ${foundReport.locationNote || ''}`;

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  // If both empty of distinctive words, check if category matches
  if (tokens1.length === 0 && tokens2.length === 0) {
    return { score: 0.5, available: true, raw: 'Category keywords match' };
  }

  // Token overlap (Jaccard on distinct tokens)
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  const commonTokens = [...set1].filter((t) => set2.has(t));
  const unionTokens = new Set([...set1, ...set2]);
  const tokenJaccard = unionTokens.size > 0 ? commonTokens.length / unionTokens.size : 0;

  // Bigram overlap
  const bigrams1 = getBigrams(tokens1);
  const bigrams2 = getBigrams(tokens2);
  let bigramJaccard = 0;
  if (bigrams1.size > 0 && bigrams2.size > 0) {
    const commonBigrams = [...bigrams1].filter((b) => bigrams2.has(b));
    const unionBigrams = new Set([...bigrams1, ...bigrams2]);
    bigramJaccard = unionBigrams.size > 0 ? commonBigrams.length / unionBigrams.size : 0;
  }

  // Bonus if keywords from org category config match
  let keywordBonus = 0;
  if (Array.isArray(categoryKeywords) && categoryKeywords.length > 0) {
    const kwSet = new Set(categoryKeywords.map((k) => k.toLowerCase()));
    const kw1 = tokens1.some((t) => kwSet.has(t));
    const kw2 = tokens2.some((t) => kwSet.has(t));
    if (kw1 && kw2) {
      keywordBonus = 0.2;
    }
  }

  // Combine: 70% unigram + 30% bigram + keyword bonus, capped at 1.0
  const combined = Math.min(1.0, tokenJaccard * 0.7 + bigramJaccard * 0.3 + keywordBonus);

  return {
    score: Math.round(combined * 1000) / 1000,
    available: true,
    raw: `Tokens: ${commonTokens.length} common words`,
  };
}

/**
 * 4b. Semantic Text Overlap Signal (weight 25)
 * Combines token overlap with Gemini semantic similarity for synonyms and descriptive phrasing.
 * Times out after 2.5s with automatic fallback to deterministic token score.
 */
export async function computeSemanticTextScore(lostReport, foundReport, categoryKeywords = [], geminiApiKey = null) {
  const baseResult = computeTextScore(lostReport, foundReport, categoryKeywords);
  const apiKey = geminiApiKey || (env.GEMINI_API_KEY || env.AI_API_KEY || '').trim();

  // If no Gemini key or base result already has very high confidence, skip LLM
  if (!apiKey || baseResult.score >= 0.85) {
    return baseResult;
  }

  const text1 = `${lostReport.title || ''} ${lostReport.description || ''}`.trim();
  const text2 = `${foundReport.title || ''} ${foundReport.description || ''}`.trim();

  if (text1.length < 4 || text2.length < 4) {
    return baseResult;
  }

  try {
    const prompt = `You are a semantic text matcher for a physical lost-and-found system.
Evaluate the semantic similarity between these two item descriptions. They might use synonyms or different phrasing for the same object (e.g., "crimson hydroflask" vs "red water bottle", "spectacles" vs "eyeglasses", "earbuds" vs "airpods", "gym duffle" vs "sports bag").

Lost Item: "${text1}"
Found Item: "${text2}"

Output strictly valid JSON with this schema:
{
  "similarity": number (0.0 to 1.0, where 1.0 is definitely the same item type, 0.5 is plausibly related, 0.0 is completely different),
  "reason": string (short 4-8 word rationale)
}

Output ONLY the JSON object, with no markdown fences, no formatting, and no explanation.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (typeof parsed.similarity === 'number' && !isNaN(parsed.similarity)) {
          const sim = Math.max(0, Math.min(1.0, parsed.similarity));
          const boostedScore = Math.max(baseResult.score, Math.round(sim * 1000) / 1000);
          return {
            score: boostedScore,
            available: true,
            raw: parsed.reason ? `Semantic match: ${parsed.reason}` : baseResult.raw,
          };
        }
      }
    }
  } catch (err) {
    // Graceful fallback to deterministic token score on error or timeout
  }

  return baseResult;
}

/**
 * Score a candidate pair with missing-data renormalization.
 *
 * Weights:
 * - Time: 30
 * - Location: 25
 * - Colors: 20
 * - Text: 25
 */
export function scorePair(lostReport, foundReport, org) {
  const timeWindowHours = org?.timeWindowHours || 72;
  const orgLocations = org?.locations || [];

  const categoryDef = org?.categories?.find((c) => c.key === lostReport.category) || null;
  const categoryKeywords = categoryDef?.keywords || [];

  const timeResult = computeTimeScore(lostReport, foundReport, timeWindowHours);
  const locResult = computeLocationScore(lostReport, foundReport, orgLocations);
  const colorsResult = computeColorsBrandScore(lostReport, foundReport);
  const textResult = computeTextScore(lostReport, foundReport, categoryKeywords);

  const signals = [
    { key: 'time', weight: 30, ...timeResult },
    { key: 'location', weight: 25, ...locResult },
    { key: 'colors', weight: 20, ...colorsResult },
    { key: 'text', weight: 25, ...textResult },
  ];

  let weightedSum = 0;
  let totalAvailableWeight = 0;
  const breakdown = {};

  for (const s of signals) {
    breakdown[s.key] = {
      score: s.score,
      weight: s.weight,
      available: s.available,
      raw: s.raw,
    };

    if (s.available) {
      weightedSum += s.score * s.weight;
      totalAvailableWeight += s.weight;
    }
  }

  // Missing data renormalization
  const finalScore =
    totalAvailableWeight > 0
      ? Math.round((weightedSum / totalAvailableWeight) * 10000) / 10000
      : 0;

  // Sensitivity thresholds
  const sensitivityKey = (org?.matchSensitivity || 'balanced').toLowerCase();
  const thresholds = SENSITIVITY_THRESHOLDS[sensitivityKey] || SENSITIVITY_THRESHOLDS.balanced;

  let band = null;
  let isMatch = false;

  if (finalScore >= thresholds.highAbove) {
    band = 'high';
    isMatch = true;
  } else if (finalScore >= thresholds.hideBelow) {
    band = 'possible';
    isMatch = true;
  } else {
    isMatch = false; // Hidden below threshold
  }

  return {
    score: finalScore,
    band,
    isMatch,
    breakdown,
    totalAvailableWeight,
  };
}

/**
 * Asynchronous pair scorer with Gemini semantic text similarity.
 */
export async function scorePairAsync(lostReport, foundReport, org) {
  const timeWindowHours = org?.timeWindowHours || 72;
  const orgLocations = org?.locations || [];

  const categoryDef = org?.categories?.find((c) => c.key === lostReport.category) || null;
  const categoryKeywords = categoryDef?.keywords || [];

  const timeResult = computeTimeScore(lostReport, foundReport, timeWindowHours);
  const locResult = computeLocationScore(lostReport, foundReport, orgLocations);
  const colorsResult = computeColorsBrandScore(lostReport, foundReport);
  const textResult = await computeSemanticTextScore(lostReport, foundReport, categoryKeywords);

  const signals = [
    { key: 'time', weight: 30, ...timeResult },
    { key: 'location', weight: 25, ...locResult },
    { key: 'colors', weight: 20, ...colorsResult },
    { key: 'text', weight: 25, ...textResult },
  ];

  let weightedSum = 0;
  let totalAvailableWeight = 0;
  const breakdown = {};

  for (const s of signals) {
    breakdown[s.key] = {
      score: s.score,
      weight: s.weight,
      available: s.available,
      raw: s.raw,
    };

    if (s.available) {
      weightedSum += s.score * s.weight;
      totalAvailableWeight += s.weight;
    }
  }

  // Missing data renormalization
  const finalScore =
    totalAvailableWeight > 0
      ? Math.round((weightedSum / totalAvailableWeight) * 10000) / 10000
      : 0;

  // Sensitivity thresholds
  const sensitivityKey = (org?.matchSensitivity || 'balanced').toLowerCase();
  const thresholds = SENSITIVITY_THRESHOLDS[sensitivityKey] || SENSITIVITY_THRESHOLDS.balanced;

  let band = null;
  let isMatch = false;

  if (finalScore >= thresholds.highAbove) {
    band = 'high';
    isMatch = true;
  } else if (finalScore >= thresholds.hideBelow) {
    band = 'possible';
    isMatch = true;
  } else {
    isMatch = false;
  }

  return {
    score: finalScore,
    band,
    isMatch,
    breakdown,
    totalAvailableWeight,
  };
}

