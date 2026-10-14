import { env } from '../../config/env.js';
import { parseQueryWithKeywords, redactSensitiveText } from './keywordParse.js';

export async function parseQuery(sentence, org) {
  const geminiKey = (env.GEMINI_API_KEY || env.AI_API_KEY || '').trim();

  // If Gemini API Key is configured and org allows AI, call Gemini REST API
  if (geminiKey && org?.aiEnabled !== false) {
    try {
      const cleanSentence = redactSensitiveText(sentence || '');
      const validCategories = (org?.categories || []).map((c) => ({ key: c.key, label: c.label }));
      const validLocations = (org?.locations || []).map((l) => ({ key: l.key, label: l.label }));

      const prompt = `You are a lost and found attribute extraction engine. Analyze the following sentence describing a lost or found item.
Extract structured attributes in strictly valid JSON format matching this schema:
{
  "category": string (MUST be one of these valid keys: ${JSON.stringify(validCategories.map((c) => c.key))}, or null),
  "colors": string[] (up to 2 dominant colors capitalized like ["Blue", "Silver"]),
  "location": string (MUST be one of these valid keys: ${JSON.stringify(validLocations.map((l) => l.key))}, or null),
  "timeChip": string (one of "Just now", "Earlier today", "Yesterday", "2-3 days ago"),
  "title": string (concise item name like "Blue Apple iPhone 13"),
  "brand": string (brand name if mentioned, otherwise ""),
  "description": string (the user's description)
}

Valid Categories: ${JSON.stringify(validCategories)}
Valid Locations: ${JSON.stringify(validLocations)}

User sentence: "${cleanSentence}"

Output ONLY the JSON object, with no markdown fences, no formatting, and no explanation.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS || 8000);

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
          return {
            category: parsed.category || null,
            colors: Array.isArray(parsed.colors) ? parsed.colors.slice(0, 2) : [],
            location: parsed.location || null,
            timeChip: parsed.timeChip || 'Earlier today',
            title: parsed.title || '',
            brand: parsed.brand || '',
            description: parsed.description || cleanSentence,
            source: 'gemini',
          };
        }
      }
    } catch (err) {
      console.warn('Gemini query parsing failed or timed out; falling back to deterministic keywords parser:', err.message);
    }
  }

  // Guaranteed deterministic keyword parser fallback (<5ms execution)
  return parseQueryWithKeywords(sentence, org);
}
