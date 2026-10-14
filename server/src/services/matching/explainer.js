/**
 * Explainer: Generates deterministic natural-language explanations for match cards
 * based on the highest contributing signals.
 */

export function generateExplanation(lostReport, foundReport, scoreResult, org) {
  const { score, band, breakdown } = scoreResult;

  const prefix = band === 'high' ? 'Likely match' : 'Possible match';
  const phrases = [];

  // 1. Color and Brand
  const colors1 = (lostReport.colors || []).map((c) => c.toLowerCase());
  const colors2 = (foundReport.colors || []).map((c) => c.toLowerCase());
  const commonColors = colors1.filter((c) => colors2.includes(c));

  const brand1 = (lostReport.brand || '').trim();
  const brand2 = (foundReport.brand || '').trim();
  const brandMatch = brand1 && brand2 && brand1.toLowerCase() === brand2.toLowerCase();

  if (commonColors.length > 0 && brandMatch) {
    phrases.push(`both are ${commonColors.join('/')} ${brand1} items`);
  } else if (commonColors.length > 0) {
    phrases.push(`both are ${commonColors.join('/')}`);
  } else if (brandMatch) {
    phrases.push(`both match brand (${brand1})`);
  }

  // 2. Location
  const locLost = lostReport.location;
  const locFound = foundReport.location;
  const l1 = org?.locations?.find((l) => l.key === locLost);
  const l2 = org?.locations?.find((l) => l.key === locFound);
  const locName = l1?.label || locLost;

  if (locLost && locFound && locLost === locFound) {
    phrases.push(`reported at ${locName}`);
  } else if (l1?.zone && l2?.zone && l1.zone === l2.zone) {
    phrases.push(`reported in the same campus zone (${l1.zone})`);
  } else if (breakdown.location?.score >= 0.8) {
    phrases.push('reported in close physical proximity');
  }

  // 3. Time
  const lostFrom = new Date(lostReport.occurredFrom).getTime();
  const foundTime = new Date(foundReport.occurredFrom).getTime();
  const hoursDiff = Math.abs(Math.round((foundTime - lostFrom) / 3600000));

  if (hoursDiff <= 2) {
    phrases.push('within 2 hours of each other');
  } else if (hoursDiff <= 12) {
    phrases.push(`within ${hoursDiff} hours of each other`);
  } else if (breakdown.time?.score === 1.0) {
    phrases.push('within the reported loss time window');
  }

  // 4. Text overlap highlight
  const tokens1 = (lostReport.description || '').toLowerCase().split(/\s+/);
  const tokens2 = (foundReport.description || '').toLowerCase().split(/\s+/);
  const textOverlap = tokens1.filter((t) => t.length > 3 && tokens2.includes(t));

  if (textOverlap.length > 0) {
    const sample = textOverlap.slice(0, 2).join(', ');
    phrases.push(`both mention '${sample}'`);
  }

  if (phrases.length === 0) {
    return `${prefix}: reports share category (${lostReport.category}) and matching timeline.`;
  }

  if (phrases.length === 1) {
    return `${prefix}: ${phrases[0]}.`;
  }

  const last = phrases.pop();
  return `${prefix}: ${phrases.join(', ')} and ${last}.`;
}
