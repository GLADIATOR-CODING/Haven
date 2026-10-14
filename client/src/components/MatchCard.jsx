import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Clock,
  Palette,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  Shield,
  EyeOff,
  X,
} from 'lucide-react';

export default function MatchCard({
  match,
  orgSlug,
  onDismiss = null,
  showClaimButton = true,
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const { score, band, breakdown, explanation, pairedReport } = match;
  const isHigh = band === 'high';
  const scorePercent = Math.round(score * 100);

  const handleDismiss = async () => {
    if (!onDismiss) return;
    setDismissing(true);
    try {
      await onDismiss(match.id);
    } finally {
      setDismissing(false);
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden bg-[var(--bg-card)] shadow-xs ${
        isHigh
          ? 'border-emerald-500/40 dark:border-emerald-500/30 ring-1 ring-emerald-500/20'
          : 'border-amber-500/40 dark:border-amber-500/30'
      }`}
    >
      {/* Top Banner: Score Band & Percentage */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between text-xs font-mono font-semibold border-b ${
          isHigh
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider">
            {isHigh ? 'High Confidence Match' : 'Possible Match'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                isHigh ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-500'
              }`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <span className="font-bold">{scorePercent}%</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Paired Report Summary */}
        <div className="flex items-start gap-3.5">
          {/* Photo or Sensitive Mask Thumbnail */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex-shrink-0 flex items-center justify-center relative">
            {pairedReport?.photo?.url && !pairedReport?.photoMasked ? (
              <img
                src={pairedReport.photo.url}
                alt={pairedReport.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center text-[var(--text-muted)]">
                {pairedReport?.photoMasked ? (
                  <>
                    <EyeOff className="w-5 h-5 text-amber-500 mb-0.5" />
                    <span className="text-[9px] font-mono leading-none">Masked</span>
                  </>
                ) : (
                  <Shield className="w-5 h-5 opacity-40" />
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {pairedReport?.category?.replace(/_/g, ' ') || 'Item'}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {pairedReport?.occurredFrom
                  ? new Date(pairedReport.occurredFrom).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent'}
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
              {pairedReport?.title || 'Reported Item'}
            </h4>

            {pairedReport?.description && (
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                {pairedReport.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pt-0.5">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                <span className="truncate">
                  {pairedReport?.locationZone || pairedReport?.location || 'Campus'}
                </span>
              </span>

              {pairedReport?.colors?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Palette className="w-3 h-3 flex-shrink-0" />
                  <span>{pairedReport.colors.join(', ')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Natural Language Explanation Pill */}
        <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">{explanation}</span>
          </div>
        </div>

        {/* Signal Breakdown Accordion */}
        {breakdown && (
          <div>
            <button
              onClick={() => setShowBreakdown((prev) => !prev)}
              className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
            >
              <span>{showBreakdown ? 'Hide score breakdown' : 'View score breakdown'}</span>
              {showBreakdown ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showBreakdown && (
              <div className="mt-2.5 p-3 rounded-lg bg-[var(--bg-subtle)]/60 border border-[var(--border-subtle)] text-xs space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Time Signal */}
                  <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-0.5">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between">
                      <span>TIME (30%)</span>
                      <span className="font-bold">
                        {breakdown.time?.available
                          ? `${Math.round((breakdown.time.score || 0) * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {breakdown.time?.raw || 'Time window'}
                    </div>
                  </div>

                  {/* Location Signal */}
                  <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-0.5">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between">
                      <span>LOCATION (25%)</span>
                      <span className="font-bold">
                        {breakdown.location?.available
                          ? `${Math.round((breakdown.location.score || 0) * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {breakdown.location?.raw || 'Proximity'}
                    </div>
                  </div>

                  {/* Colors & Brand */}
                  <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-0.5">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between">
                      <span>COLOR/BRAND (20%)</span>
                      <span className="font-bold">
                        {breakdown.colors?.available
                          ? `${Math.round((breakdown.colors.score || 0) * 100)}%`
                          : 'DROPPED'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {breakdown.colors?.available
                        ? breakdown.colors.raw
                        : 'Renormalized'}
                    </div>
                  </div>

                  {/* Text Overlap */}
                  <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-0.5">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between">
                      <span>TEXT (25%)</span>
                      <span className="font-bold">
                        {breakdown.text?.available
                          ? `${Math.round((breakdown.text.score || 0) * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {breakdown.text?.raw || 'Token overlap'}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[var(--text-muted)] text-right">
                  RENORMALIZED DETERMINISTIC SCORING ENGINE
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="pt-1 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)]">
          {onDismiss && (
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="text-xs text-[var(--text-muted)] hover:text-red-500 font-medium transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Not mine (Dismiss)</span>
            </button>
          )}

          {showClaimButton && pairedReport && (
            <Link
              to={`/o/${orgSlug}/claim/${pairedReport.id}`}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-xs"
            >
              <span>This might be mine: Claim</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
