import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  MapPin,
  Lock,
  EyeOff,
  Copy,
  Check,
  Building2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  KeyRound,
  X,
} from 'lucide-react';
import { NormalCustodyVault, AsciiGhostMascot } from '../components/AsciiGraphics';

export default function ClaimPage() {
  const { slug, id } = useParams();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [selectedLostId, setSelectedLostId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // 1. Fetch organization configuration
  const { data: orgData } = useQuery({
    queryKey: ['orgConfig', slug],
    queryFn: () => api.get(`/api/o/${slug}`),
    retry: 1,
  });

  // 2. Fetch the found report details
  const {
    data: reportData,
    isLoading: reportLoading,
    isError: reportError,
  } = useQuery({
    queryKey: ['claimReport', slug, id],
    queryFn: () => api.get(`/api/o/${slug}/reports/${id}`),
    retry: 1,
  });

  // 3. Fetch user's own reports to optionally link a lost report
  const { data: myData } = useQuery({
    queryKey: ['myReports', slug],
    queryFn: () => api.get(`/api/o/${slug}/reports/mine`),
    enabled: !!orgData,
  });

  const org = orgData?.org;
  const report = reportData?.report;
  const myReports = myData?.reports || [];
  const myLostReports = myReports.filter((r) => r.type === 'lost' && r.status !== 'resolved');

  const categoryConfig = org?.categories?.find((c) => c.key === report?.category);
  const isSensitive = categoryConfig?.sensitive || report?.photoMasked || false;
  const verificationPrompts = categoryConfig?.verificationPrompts || [];

  const handleAnswerChange = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Build answers array
      let formattedAnswers = [];
      if (isSensitive) {
        if (verificationPrompts.length > 0) {
          formattedAnswers = verificationPrompts.map((p) => ({
            key: p.key,
            label: p.label,
            value: (answers[p.key] || '').trim(),
          }));
        } else {
          formattedAnswers = [
            {
              key: 'general_description',
              label: 'Distinctive markings or details',
              value: (answers['general_description'] || '').trim(),
            },
          ];
        }
      } else {
        // Non-sensitive: optional note
        if (answers['pickup_note']) {
          formattedAnswers = [
            {
              key: 'pickup_note',
              label: 'Claimant pickup note',
              value: (answers['pickup_note'] || '').trim(),
            },
          ];
        }
      }

      const res = await api.post(`/api/o/${slug}/claims`, {
        foundId: id,
        lostId: selectedLostId || undefined,
        answers: formattedAnswers,
      });

      setClaimResult(res);
    } catch (err) {
      if (err.status === 409) {
        setError('Someone else is claiming this item right now. If their claim is not approved, it will be released back to the feed.');
      } else if (err.status === 429) {
        setError(err.message || 'Maximum claim attempts reached for this item.');
      } else {
        setError(err.message || 'Failed to submit claim. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyHandoverCode = (code) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  /* LOADING STATE */
  if (reportLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        <div className="h-40 skeleton-box rounded-xl" />
        <div className="h-60 skeleton-box rounded-xl" />
      </div>
    );
  }

  /* ERROR STATE */
  if (reportError || !report) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Item Unavailable</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            This item could not be found or is no longer available for claiming.
          </p>
          <Link
            to={`/o/${slug}/feed`}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-bold inline-block"
          >
            Back to Found Feed
          </Link>
        </div>
      </div>
    );
  }

  /* SUCCESS STATE (CLAIM RESULT) */
  if (claimResult) {
    const { claim, handoverInstructions } = claimResult;
    const isApproved = claim.status === 'approved';

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-10 shadow-sm space-y-6 text-center">
          {/* Header Icon */}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border ${
              isApproved
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}
          >
            {isApproved ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>

          <div className="space-y-1.5">
            <span
              className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                isApproved
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {isApproved ? 'CLAIM APPROVED · HANDOVER READY' : 'CLAIM SUBMITTED · UNDER REVIEW'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {isApproved ? 'Ownership Verified!' : 'Claim Under Desk Review'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              {isApproved
                ? 'Your submitted verification answers matched custody records. Present the 6-digit code below to collect physical custody.'
                : 'Your verification answers have been forwarded to the workspace security desk for quick manual review.'}
            </p>
          </div>

          {/* 6-Digit Handover Code Card (If Approved) */}
          {isApproved && claim.handoverCode && (
            <div className="p-5 sm:p-6 rounded-xl bg-neutral-950 text-white border border-neutral-800 space-y-3 shadow-lg">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                OFFICIAL 6-DIGIT HANDOVER CODE
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-emerald-400">
                  {claim.handoverCode}
                </span>
                <button
                  onClick={() => copyHandoverCode(claim.handoverCode)}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                  title="Copy code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Single-use physical handover code. Entering 5 invalid codes permanently locks custody.
              </p>
            </div>
          )}

          {/* Review Stepper (If Under Review) */}
          {!isApproved && (
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3 text-left">
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
                Verification Lifecycle:
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  1. Submitted ✓
                </span>
                <span className="opacity-40">→</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                  2. Desk Review ⏳
                </span>
                <span className="opacity-40">→</span>
                <span className="text-[var(--text-muted)]">3. Handover Code</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1">
                Moderators at {org?.name || 'the desk'} verify claims to prevent unauthorized release.
                You can monitor live review progress in your Activity hub.
              </p>
            </div>
          )}

          {/* Physical Handover Instructions */}
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-left space-y-2">
            <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span>Physical Collection Desk</span>
            </div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
              {handoverInstructions}
            </p>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--border-subtle)]">
            <Link
              to={`/o/${slug}?tab=claims`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-xs text-center"
            >
              View in My Claims Tab
            </Link>
            <Link
              to={`/o/${slug}`}
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Back to Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* CLAIM FORM VIEW */
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to={`/o/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </Link>
        <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
          {isSensitive ? 'DESK VERIFICATION PROTOCOL' : 'INSTANT AUTO-APPROVAL'}
        </span>
      </div>

      <div className="space-y-1">
        <div
          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
            isSensitive
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
          }`}
        >
          {isSensitive ? 'SENSITIVE PROPERTY · DESK REVIEW' : 'STANDARD CUSTODY · INSTANT CLAIM'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          {isSensitive ? 'Verify Ownership to Claim' : 'Claim this item'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          {isSensitive
            ? 'This item contains sensitive property. Provide the verification details below for desk staff review.'
            : 'Standard items are auto-approved instantly. Click below to receive your 6-digit pickup code.'}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2 shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Target Item Summary Preview Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex-shrink-0 flex items-center justify-center">
          {report.photo?.url && !report.photoMasked ? (
            <img src={report.photo.url} alt={report.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-2 text-[var(--text-muted)]">
              {report.photoMasked ? (
                <EyeOff className="w-6 h-6 text-amber-500 mx-auto" />
              ) : (
                <Shield className="w-6 h-6 opacity-40 mx-auto" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              {report.category?.replace(/_/g, ' ')}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(report.occurredFrom).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
            {report.title || `${report.category} item`}
          </h3>

          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>{report.locationZone || report.location}</span>
            </span>
            {report.colors?.length > 0 && <span>Colors: {report.colors.join(', ')}</span>}
          </div>
        </div>
      </div>

      {/* Verification Prompts Form */}
      <form onSubmit={handleSubmitClaim} className="space-y-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-500" />
              <span>{isSensitive ? 'Verification Questions' : 'Claim Confirmation'}</span>
            </h3>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {isSensitive ? 'SECURITY CHALLENGE' : 'INSTANT VERIFICATION'}
            </span>
          </div>

          {!isSensitive ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Standard Item · Instant 1-Click Verification</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  This item is non-sensitive and eligible for immediate auto-approval. You do not need to answer complicated verification questions. Click below to receive your 6-digit pickup code to collect your item from the custody drop-off desk.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Pickup Note or Desk Message (Optional)
                </label>
                <input
                  type="text"
                  value={answers['pickup_note'] || ''}
                  onChange={(e) => handleAnswerChange('pickup_note', e.target.value)}
                  placeholder="e.g. Will collect today at 4:30 PM after class"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          ) : verificationPrompts.length > 0 ? (
            <div className="space-y-4">
              {verificationPrompts.map((prompt) => (
                <div key={prompt.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
                    <span>{prompt.label}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                      {prompt.kind === 'secret' ? 'Secret Match (HMAC)' : 'Fuzzy Text'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={answers[prompt.key] || ''}
                    onChange={(e) => handleAnswerChange(prompt.key, e.target.value)}
                    placeholder={
                      prompt.kind === 'secret'
                        ? 'e.g. Serial number, exact ID number, or passcode hint'
                        : 'e.g. Blue mountain sticker, small scratch on base'
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {prompt.kind === 'secret'
                      ? 'Evaluated using normalized HMAC-SHA256 comparison.'
                      : 'Evaluated using fuzzy token similarity.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                Distinctive Markings or Details
              </label>
              <textarea
                rows={3}
                value={answers['general_description'] || ''}
                onChange={(e) => handleAnswerChange('general_description', e.target.value)}
                placeholder="Describe any stickers, unique scratches, logos, contents, or serial numbers that prove this item belongs to you."
                className="w-full p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          )}

          {/* Optional: Link Open Lost Report */}
          {myLostReports.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Link to your existing Lost Report (Optional)
              </label>
              <select
                value={selectedLostId}
                onChange={(e) => setSelectedLostId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="">No linked lost report</option>
                {myLostReports.map((lr) => (
                  <option key={lr.id} value={lr.id}>
                    {lr.title} ({new Date(lr.occurredFrom).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Submit Claim Button */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-sm tracking-wide transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Processing custody claim...</span>
            ) : !isSensitive ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                <span>Confirm Claim &amp; Generate Pickup Code</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 stroke-[2.5]" />
                <span>Submit Verification Claim</span>
              </>
            )}
          </button>

          <p className="text-[11px] font-mono text-[var(--text-muted)] text-center">
            {isSensitive
              ? 'ATOMIC CUSTODY LOCK ENFORCED · DESK MODERATION ACTIVE'
              : 'INSTANT AUTO-APPROVAL · NO REUSED CODES'}
          </p>
        </div>
      </form>
    </div>
  );
}
