import { env } from '../../config/env.js';

export async function analyzeItemImage(fileBuffer, mimeType = 'image/jpeg', org) {
  const geminiKey = (env.GEMINI_API_KEY || env.AI_API_KEY || '').trim();

  if (!geminiKey || org?.aiEnabled === false) {
    return {
      category: null,
      colors: [],
      brand: '',
      title: '',
      description: '',
      sensitive: false,
      source: 'offline_fallback',
    };
  }

  try {
    const base64Data = fileBuffer.toString('base64');
    const validCategories = (org?.categories || []).map((c) => ({
      key: c.key,
      label: c.label,
      sensitive: !!c.sensitive,
    }));

    const prompt = `You are an expert lost-and-found computer vision classifier for physical spaces.
Analyze this photo of an item found on campus or in an office.
Extract the physical attributes and output strictly valid JSON matching this schema:
{
  "category": string (MUST be one of these valid keys: ${JSON.stringify(validCategories.map((c) => c.key))}, or null),
  "colors": string[] (up to 2 dominant colors like ["Black", "Silver", "Blue", "Red", "White", "Gray", "Green"]),
  "brand": string (detected brand or manufacturer name like "Apple", "Sony", "Hydro Flask", "Nike", "Dell", or "" if none),
  "title": string (concise 3-6 word title for the item like "Sony Over-Ear Wireless Headphones" or "Hydro Flask Blue Water Bottle"),
  "description": string (clean 1-2 sentence summary of visual traits, physical condition, distinctive stickers, or engravings),
  "sensitive": boolean (MUST BE TRUE if this is an ID card, student badge, passport, driver license, bank card, keycard with personal info, or wallet with exposed cards),
  "sensitiveReason": string (brief reason if sensitive, else "")
}

Configured categories for this space:
${JSON.stringify(validCategories, null, 2)}

Output ONLY the JSON object, with no markdown fences, no formatting, and no explanation.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS || 8000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: base64Data,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
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
          brand: parsed.brand || '',
          title: parsed.title || '',
          description: parsed.description || '',
          sensitive: !!parsed.sensitive,
          sensitiveReason: parsed.sensitiveReason || '',
          source: 'gemini_vision',
        };
      }
    } else {
      const errText = await response.text();
      console.warn('Gemini vision API error response:', errText);
    }
  } catch (err) {
    console.warn('Gemini image analysis failed or timed out:', err.message);
  }

  return {
    category: null,
    colors: [],
    brand: '',
    title: '',
    description: '',
    sensitive: false,
    source: 'offline_fallback',
  };
}
