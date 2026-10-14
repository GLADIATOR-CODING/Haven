import { Report } from '../../models/Report.js';
import { Claim } from '../../models/Claim.js';
import { env } from '../../config/env.js';

export async function generateAnalyticsDigest(org) {
  const orgId = org._id;

  // 1. Gather raw statistics
  const [totalFound, totalLost, handedOverCount, totalClaims, approvedClaims] = await Promise.all([
    Report.countDocuments({ orgId, type: 'found' }),
    Report.countDocuments({ orgId, type: 'lost' }),
    Report.countDocuments({ orgId, status: { $in: ['handed_over', 'resolved'] } }),
    Claim.countDocuments({ orgId }),
    Claim.countDocuments({ orgId, status: { $in: ['approved', 'collected'] } }),
  ]);

  // Category counts
  const categoryAgg = await Report.aggregate([
    { $match: { orgId } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  // Location counts
  const locationAgg = await Report.aggregate([
    { $match: { orgId } },
    { $group: { _id: '$location', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  const topCategories = categoryAgg.map((c) => {
    const label = org.categories?.find((cat) => cat.key === c._id)?.label || c._id;
    return `${label} (${c.count})`;
  });

  const topLocations = locationAgg.map((l) => {
    const label = org.locations?.find((loc) => loc.key === l._id)?.label || l._id;
    return `${label} (${l.count})`;
  });

  const resolutionRate =
    totalFound > 0 ? Math.min(100, Math.round((handedOverCount / totalFound) * 100)) : 0;

  const rawMetrics = {
    totalFound,
    totalLost,
    handedOverCount,
    totalClaims,
    approvedClaims,
    resolutionRate: `${resolutionRate}%`,
    topCategories: topCategories.join(', ') || 'None logged yet',
    topLocations: topLocations.join(', ') || 'None logged yet',
  };

  const geminiKey = (env.GEMINI_API_KEY || env.AI_API_KEY || '').trim();

  // If Gemini is available, generate executive operations digest
  if (geminiKey && org.aiEnabled !== false) {
    try {
      const prompt = `You are an operations intelligence analyst specializing in physical space custody and lost-and-found management.
Generate a high-level executive operations digest for the workspace "${org.name}".

Aggregated Platform Statistics:
- Total Found Items: ${totalFound}
- Total Lost Searches Logged: ${totalLost}
- Items Handed Over / Reunited: ${handedOverCount}
- Resolution Rate: ${resolutionRate}%
- Total Claims Submitted: ${totalClaims}
- Verified & Approved Claims: ${approvedClaims}
- Highest Volume Categories: ${rawMetrics.topCategories}
- Highest Traffic Locations: ${rawMetrics.topLocations}

Output strictly valid JSON with this schema:
{
  "headline": string (punchy 6-10 word summary like "78% Custody Resolution Rate Across Campus Spaces"),
  "summary": string (clean 2-paragraph operational assessment of resolution velocity and member engagement),
  "hotspots": string (1 paragraph highlighting the top physical zones and risk mitigation),
  "recommendations": string[] (2-3 concise operational suggestions for desk moderators)
}

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
              temperature: 0.2,
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
            headline: parsed.headline || `${resolutionRate}% Resolution Velocity at ${org.name}`,
            summary: parsed.summary || 'Operational tracking indicates active community engagement and custody recovery.',
            hotspots: parsed.hotspots || `High-traffic areas include ${rawMetrics.topLocations}.`,
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [
              'Continue enforcing zero-knowledge blind verification for sensitive items.',
              'Ensure physical drop-off confirmations are logged promptly at the desk.'
            ],
            metrics: rawMetrics,
            source: 'gemini_intelligence',
            generatedAt: new Date(),
          };
        }
      }
    } catch (err) {
      console.warn('Gemini analytics digest failed or timed out:', err.message);
    }
  }

  // Deterministic fallback summary
  return {
    headline: `${resolutionRate}% Reunited Rate Across ${org.name}`,
    summary: `${org.name} has recorded ${totalFound} found items and ${totalLost} lost queries. ${handedOverCount} items have reached complete physical custody handover, reflecting an active ${resolutionRate}% resolution velocity.`,
    hotspots: `Most items are reported in ${rawMetrics.topLocations}. The most common lost property belongs to ${rawMetrics.topCategories}.`,
    recommendations: [
      'Maintain 6-digit code verification at physical pickup counters to prevent wrongful handovers.',
      'Encourage finders to utilize prompt photo reporting to accelerate matching.'
    ],
    metrics: rawMetrics,
    source: 'deterministic_stats',
    generatedAt: new Date(),
  };
}
