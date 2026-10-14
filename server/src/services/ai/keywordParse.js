/**
 * Keyword Parser: Deterministic describe-it natural language query analyzer.
 * Robust fallback that turns a sentence like "I lost my blue Apple iPhone at Central Library yesterday"
 * into structured attributes.
 */

const KNOWN_COLORS = [
  'black', 'gray', 'grey', 'silver', 'white', 'red', 'blue', 'navy',
  'green', 'yellow', 'brown', 'pink', 'purple', 'orange', 'gold',
];

const KNOWN_BRANDS = [
  'apple', 'samsung', 'google', 'dell', 'lenovo', 'hp', 'asus', 'acer',
  'sony', 'bose', 'hydro flask', 'stanley', 'yeti', 'nike', 'adidas',
  'puma', 'north face', 'patagonia', 'jbl', 'anker', 'logitech',
];

/**
 * 1. Redaction of sensitive information:
 * Emails, phone numbers, >=10 digit numbers, and URLs.
 */
export function redactSensitiveText(text = '') {
  return text
    // Redact URLs
    .replace(/https?:\/\/[^\s]+/gi, '[REDACTED_URL]')
    // Redact email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    // Redact phone numbers and 10+ digit sequences
    .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]')
    .replace(/\b\d{10,}\b/g, '[REDACTED_NUMBER]');
}

/**
 * 2. Deterministic keyword parsing against org config
 */
export function parseQueryWithKeywords(rawSentence, org) {
  const cleanText = redactSensitiveText(rawSentence || '');
  const lower = cleanText.toLowerCase();

  const categories = org?.categories || [];
  const locations = org?.locations || [];

  // A. Match Category
  let matchedCategory = null;
  let highestKwMatches = 0;

  for (const cat of categories) {
    let kwCount = 0;
    const catLabel = cat.label.toLowerCase();
    const catKey = cat.key.toLowerCase().replace(/_/g, ' ');

    if (lower.includes(catLabel) || lower.includes(catKey)) {
      kwCount += 5;
    }

    if (Array.isArray(cat.keywords)) {
      for (const kw of cat.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          kwCount += 2;
        }
      }
    }

    // Default common category aliases
    if (cat.key === 'electronics' && (lower.includes('phone') || lower.includes('iphone') || lower.includes('laptop') || lower.includes('macbook') || lower.includes('airpods') || lower.includes('charger'))) {
      kwCount += 4;
    }
    if (cat.key === 'bottles_umbrellas' && (lower.includes('bottle') || lower.includes('flask') || lower.includes('umbrella') || lower.includes('sipper'))) {
      kwCount += 4;
    }
    if (cat.key === 'id_card' && (lower.includes('id') || lower.includes('card') || lower.includes('license') || lower.includes('badge'))) {
      kwCount += 4;
    }
    if (cat.key === 'wallet_bags' && (lower.includes('wallet') || lower.includes('purse') || lower.includes('bag') || lower.includes('backpack'))) {
      kwCount += 4;
    }
    if (cat.key === 'keys' && (lower.includes('key') || lower.includes('keychain') || lower.includes('fob'))) {
      kwCount += 4;
    }

    if (kwCount > highestKwMatches) {
      highestKwMatches = kwCount;
      matchedCategory = cat.key;
    }
  }

  // B. Match Colors
  const matchedColors = [];
  for (const color of KNOWN_COLORS) {
    const regex = new RegExp(`\\b${color}\\b`, 'i');
    if (regex.test(lower)) {
      const capitalized = color.charAt(0).toUpperCase() + color.slice(1);
      if (!matchedColors.includes(capitalized)) {
        matchedColors.push(capitalized);
      }
    }
  }

  // C. Match Brand
  let matchedBrand = '';
  for (const brand of KNOWN_BRANDS) {
    if (lower.includes(brand)) {
      matchedBrand = brand.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // D. Match Location
  let matchedLocation = null;
  for (const loc of locations) {
    const locKey = loc.key.toLowerCase().replace(/_/g, ' ');
    const locLabel = loc.label.toLowerCase();

    if (lower.includes(locLabel) || lower.includes(locKey)) {
      matchedLocation = loc.key;
      break;
    }

    // Check individual significant words
    const words = locLabel.split(/\s+/).filter((w) => w.length > 3);
    for (const word of words) {
      if (lower.includes(word)) {
        matchedLocation = loc.key;
        break;
      }
    }
    if (matchedLocation) break;
  }

  // E. Match Time Hint
  let timeChip = 'Earlier today';
  if (lower.includes('just now') || lower.includes('right now') || lower.includes('few minutes')) {
    timeChip = 'Just now';
  } else if (lower.includes('yesterday') || lower.includes('last night')) {
    timeChip = 'Yesterday';
  } else if (lower.includes('2 days') || lower.includes('few days') || lower.includes('last week')) {
    timeChip = '2+ days ago';
  } else if (lower.includes('morning') || lower.includes('afternoon') || lower.includes('today')) {
    timeChip = 'Earlier today';
  }

  // F. Suggest clean title
  let title = '';
  if (matchedBrand && matchedColors.length > 0) {
    title = `${matchedColors[0]} ${matchedBrand} ${matchedCategory ? matchedCategory.replace(/_/g, ' ') : 'item'}`;
  } else if (matchedColors.length > 0 && matchedCategory) {
    title = `${matchedColors.join('/')} ${matchedCategory.replace(/_/g, ' ')}`;
  } else if (cleanText.length > 0) {
    title = cleanText.length > 50 ? `${cleanText.substring(0, 47)}...` : cleanText;
  }

  return {
    rawSentence: cleanText,
    category: matchedCategory || (categories[0]?.key || ''),
    colors: matchedColors.slice(0, 2),
    brand: matchedBrand,
    location: matchedLocation || (locations[0]?.key || ''),
    timeChip,
    title: title.trim(),
    description: cleanText,
    source: 'keyword_parse',
    suggested: true,
  };
}
