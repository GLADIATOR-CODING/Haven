import { Report } from '../../models/Report.js';
import { Claim } from '../../models/Claim.js';
import { env } from '../../config/env.js';

export async function generateAnalyticsDigest(org, options = {}) {
  const orgId = org._id;
  const isStaff = options.isStaff ?? false;

  // 1. Gather raw statistics
  const [totalFound, totalLost, handedOverCount, totalClaims, approvedClaims, totalReports] = await Promise.all([
    Report.countDocuments({ orgId, type: 'found' }),
    Report.countDocuments({ orgId, type: 'lost' }),
    Report.countDocuments({ orgId, status: { $in: ['handed_over', 'resolved'] } }),
    Claim.countDocuments({ orgId }),
    Claim.countDocuments({ orgId, status: { $in: ['approved', 'collected'] } }),
    Report.countDocuments({ orgId }),
  ]);

  // 2. 7-Day Trend Aggregation (Lost vs Found per day)
  const days = 7;
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const trendAgg = await Report.aggregate([
    {
      $match: {
        orgId,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type',
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const dailyTrend = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const fullLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const lostItem = trendAgg.find((t) => t._id.date === dateKey && t._id.type === 'lost');
    const foundItem = trendAgg.find((t) => t._id.date === dateKey && t._id.type === 'found');

    dailyTrend.push({
      date: dateKey,
      dayLabel,
      fullLabel,
      lostCount: lostItem ? lostItem.count : 0,
      foundCount: foundItem ? foundItem.count : 0,
      totalCount: (lostItem ? lostItem.count : 0) + (foundItem ? foundItem.count : 0),
    });
  }

  // 3. Location Aggregation (Lost vs Found vs Total)
  const locationAgg = await Report.aggregate([
    { $match: { orgId } },
    {
      $group: {
        _id: '$location',
        total: { $sum: 1 },
        lostCount: { $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] } },
        foundCount: { $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] } },
      },
    },
    { $sort: { lostCount: -1, total: -1 } },
  ]);

  // 4. Category Aggregation (Lost vs Found vs Total)
  const categoryAgg = await Report.aggregate([
    { $match: { orgId } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        lostCount: { $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] } },
        foundCount: { $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] } },
      },
    },
    { $sort: { lostCount: -1, total: -1 } },
  ]);

  // Format locations stats with friendly labels and zones
  const locationStats = locationAgg.map((loc) => {
    const config = org.locations?.find((l) => l.key === loc._id);
    const label = config?.label || loc._id || 'Unspecified Location';
    const zone = config?.zone || 'General';
    const percentOfLost = totalLost > 0 ? Math.round((loc.lostCount / totalLost) * 100) : 0;
    const percentOfTotal = totalReports > 0 ? Math.round((loc.total / totalReports) * 100) : 0;
    return {
      key: loc._id,
      label,
      zone,
      totalCount: loc.total,
      lostCount: loc.lostCount,
      foundCount: loc.foundCount,
      percentOfLost,
      percentOfTotal,
    };
  });

  // Format categories stats with friendly labels and sensitivity
  const categoryStats = categoryAgg.map((cat) => {
    const config = org.categories?.find((c) => c.key === cat._id);
    const label = config?.label || cat._id || 'Miscellaneous';
    const sensitive = !!config?.sensitive;
    const autoApprove = !!config?.autoApproveClaims;
    const percentOfLost = totalLost > 0 ? Math.round((cat.lostCount / totalLost) * 100) : 0;
    const percentOfTotal = totalReports > 0 ? Math.round((cat.total / totalReports) * 100) : 0;
    return {
      key: cat._id,
      label,
      sensitive,
      autoApprove,
      totalCount: cat.total,
      lostCount: cat.lostCount,
      foundCount: cat.foundCount,
      percentOfLost,
      percentOfTotal,
    };
  });

  // Identify Top Lost Place and Top Lost Category
  const topLostLocation = locationStats.find((l) => l.lostCount > 0) || locationStats[0] || {
    key: org.locations?.[0]?.key || 'main',
    label: org.locations?.[0]?.label || 'Campus Central',
    lostCount: 0,
    foundCount: 0,
    totalCount: 0,
    percentOfLost: 0,
    zone: 'main',
  };

  const topLostCategory = categoryStats.find((c) => c.lostCount > 0) || categoryStats[0] || {
    key: org.categories?.[0]?.key || 'items',
    label: org.categories?.[0]?.label || 'General Belongings',
    lostCount: 0,
    foundCount: 0,
    totalCount: 0,
    percentOfLost: 0,
    sensitive: false,
    autoApprove: false,
  };

  const resolutionRate =
    totalFound > 0 ? Math.min(100, Math.round((handedOverCount / totalFound) * 100)) : 0;

  const rawMetrics = {
    totalFound,
    totalLost,
    totalReports,
    handedOverCount,
    totalClaims,
    approvedClaims,
    resolutionRate: `${resolutionRate}%`,
    dailyTrend,
    isStaff,
    mostLostLocation: {
      label: topLostLocation.label,
      lostCount: topLostLocation.lostCount,
      percentOfLost: topLostLocation.percentOfLost,
      zone: topLostLocation.zone,
    },
    mostLostCategory: {
      label: topLostCategory.label,
      lostCount: topLostCategory.lostCount,
      percentOfLost: topLostCategory.percentOfLost,
      sensitive: topLostCategory.sensitive,
    },
    locationStats,
    categoryStats,
  };

  const geminiKey = (env.GEMINI_API_KEY || env.AI_API_KEY || '').trim();

  // If Gemini is available, generate executive operations digest with role awareness
  if (geminiKey && org.aiEnabled !== false) {
    try {
      const prompt = `You are a physical asset protection and security operations analyst specializing in workspace custody management.
Generate an operational and member intelligence report for "${org.name}".
Audience: ${isStaff ? 'Workspace Administrators & Desk Staff (Confidential operational intelligence)' : 'Community Members (Public-facing helpful advice)'}

RAW AGGREGATED STATISTICS:
- Total Lost Queries: ${totalLost}
- Total Found Items: ${totalFound}
- Physical Custody Handed Over: ${handedOverCount} (${resolutionRate}% resolution velocity)
- Claims Processed: ${totalClaims} (${approvedClaims} approved)
- Top Lost Place: "${topLostLocation.label}" with ${topLostLocation.lostCount} lost items (${topLostLocation.percentOfLost}% of all lost reports)
- Most Lost Item Type: "${topLostCategory.label}" with ${topLostCategory.lostCount} lost items (${topLostCategory.percentOfLost}% of all lost property)

Generate a clean JSON report matching this exact schema:
{
  "headline": string (punchy 6-10 word summary),
  "summary": string (clean 1-2 paragraph assessment),
  "hotspotDeepDive": {
    "locationName": "${topLostLocation.label}",
    "whyProneToLoss": string (${isStaff ? 'explain facility security dynamics' : 'friendly note for members to check belongings'}),
    "mitigationActions": string (${isStaff ? 'specific physical security instructions for staff' : 'null'})
  },
  "itemDeepDive": {
    "categoryName": "${topLostCategory.label}",
    "vulnerabilityReason": string (why this category has high loss rate),
    "preventionAdvice": string (concrete guidance for members to safeguard this item)
  },
  "safetyAndSecurityPlaybook": ${isStaff ? `[
    {
      "title": string,
      "category": "Physical Security" | "Staff Protocol" | "Facilities" | "Awareness",
      "impact": "High" | "Medium",
      "action": string,
      "benefit": string
    }
  ]` : 'null'},
  "experienceEnhancements": ${isStaff ? `[
    {
      "title": string,
      "description": string,
      "impact": string
    }
  ]` : 'null'},
  "communityBroadcastTips": string[] (3 punchy, friendly tips for members)
}

Output ONLY valid JSON.`;

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

          // Enforce strict server-side zero-leak: if not staff, never return playbook or mitigationActions
          return {
            headline: parsed.headline || (isStaff ? `${resolutionRate}% Custody Resolution Velocity` : `${resolutionRate}% Items Reunited`),
            summary: parsed.summary || (isStaff ? 'Operational metrics show active recovery tracking across facilities.' : 'Members are actively helping reunite lost belongings across campus.'),
            hotspotDeepDive: {
              locationName: topLostLocation.label,
              whyProneToLoss: isStaff
                ? (parsed.hotspotDeepDive?.whyProneToLoss || `${topLostLocation.label} accounts for the highest share of reported losses due to high pedestrian turnover.`)
                : `${topLostLocation.label} is our most frequented area. Remember to check around your seat and table before leaving.`,
              ...(isStaff ? { mitigationActions: parsed.hotspotDeepDive?.mitigationActions || `Increase staff visibility and install marked drop-off custody boxes near entrances of ${topLostLocation.label}.` } : {}),
            },
            itemDeepDive: {
              categoryName: topLostCategory.label,
              vulnerabilityReason: parsed.itemDeepDive?.vulnerabilityReason || `${topLostCategory.label} items are portable, easily left behind, and frequently identical in appearance.`,
              preventionAdvice: parsed.itemDeepDive?.preventionAdvice || 'Encourage members to add distinct identifiers, keychains, or emergency lockscreen wallpapers.',
            },
            safetyAndSecurityPlaybook: isStaff && Array.isArray(parsed.safetyAndSecurityPlaybook)
              ? parsed.safetyAndSecurityPlaybook
              : null,
            experienceEnhancements: isStaff && Array.isArray(parsed.experienceEnhancements)
              ? parsed.experienceEnhancements
              : null,
            communityBroadcastTips: Array.isArray(parsed.communityBroadcastTips) && parsed.communityBroadcastTips.length > 0
              ? parsed.communityBroadcastTips
              : [
                  `Check your surroundings before leaving ${topLostLocation.label} — it is currently our highest lost-item hotspot.`,
                  `Label your ${topLostCategory.label} with a digital contact wallpaper or distinctive tag.`,
                  `Turn in found property immediately at ${org.handoverInstructions || 'the security desk'} to ensure fast reunion.`,
                ],
            metrics: rawMetrics,
            isStaff,
            source: 'gemini_intelligence',
            generatedAt: new Date(),
          };
        }
      }
    } catch (err) {
      console.warn('Gemini analytics digest failed or timed out:', err.message);
    }
  }

  // Guaranteed deterministic fallback report with role-based filtering
  return {
    headline: isStaff
      ? `${resolutionRate}% Custody Resolution Velocity at ${org.name}`
      : `${resolutionRate}% Items Safely Reunited Across ${org.name}`,
    summary: isStaff
      ? `${org.name} has recorded ${totalFound} found items and ${totalLost} lost queries. ${handedOverCount} items have reached complete physical custody handover, reflecting an active ${resolutionRate}% resolution velocity.`
      : `${org.name} community members have logged ${totalFound} found items and resolved ${handedOverCount} pickups. Review weekly trends and community tips below.`,
    hotspotDeepDive: {
      locationName: topLostLocation.label,
      whyProneToLoss: isStaff
        ? `${topLostLocation.label} accounts for ${topLostLocation.percentOfLost}% of reported lost items due to heavy pedestrian volume and shared seating.`
        : `${topLostLocation.label} is our most active community space. Make sure to double-check personal items before leaving.`,
      ...(isStaff ? {
        mitigationActions: `Deploy clear loss-prevention signage and a dedicated physical drop-box at ${topLostLocation.label}.`,
      } : {}),
    },
    itemDeepDive: {
      categoryName: topLostCategory.label,
      vulnerabilityReason: `${topLostCategory.label} is the #1 lost item category (${topLostCategory.percentOfLost}% of all lost reports). Its portability makes it prone to being forgotten on benches and desks.`,
      preventionAdvice: 'Keep devices zipped in bags and use lock-screen emergency contact info to speed up returns.',
    },
    safetyAndSecurityPlaybook: isStaff
      ? [
          {
            title: `Designate Monitored Drop-off at ${topLostLocation.label}`,
            category: 'Physical Security',
            impact: 'High',
            action: `Install a physical custody drop-off receptacle near the main desk in ${topLostLocation.label} with clear operating hours.`,
            benefit: 'Reduces transit time between an item being found and being logged into verified digital custody.',
          },
          {
            title: `Mandatory Verification for ${topLostCategory.label}`,
            category: 'Staff Protocol',
            impact: 'High',
            action: 'Enforce secret verification questions (passcode hints, unique scratches, or receipts) before releasing property.',
            benefit: 'Prevents fraudulent claims and safeguards high-value belongings.',
          },
          {
            title: 'Conduct Scheduled Facility Sweeps',
            category: 'Facilities',
            impact: 'Medium',
            action: 'Schedule daily 15-minute lost item sweeps of study tables, lecture halls, and dining areas at closing time.',
            benefit: 'Identifies misplaced items before unauthorized individuals can tamper with or take them.',
          },
        ]
      : null,
    experienceEnhancements: isStaff
      ? [
          {
            title: 'One-Click Auto-Approve for Everyday Utilities',
            description: 'Keep water bottles and notebooks on instant auto-approval to prevent unnecessary desk queuing.',
            impact: 'Cuts claimant waiting times from hours to seconds.',
          },
          {
            title: 'Proactive Lost-Report Matching Alerts',
            description: 'Remind claimants automatically when a high-confidence match is published for their lost report.',
            impact: 'Boosts resolution rate by over 35%.',
          },
        ]
      : null,
    communityBroadcastTips: [
      `Check your surroundings before leaving ${topLostLocation.label} — it is currently our highest lost-item hotspot.`,
      `Label your ${topLostCategory.label} with a digital contact wallpaper or distinctive tag.`,
      `Turn in found property immediately at ${org.handoverInstructions || 'the security desk'} to ensure fast reunion.`,
    ],
    metrics: rawMetrics,
    isStaff,
    source: 'deterministic_stats',
    generatedAt: new Date(),
  };
}
