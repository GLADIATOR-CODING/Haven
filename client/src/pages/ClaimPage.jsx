import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  ChevronRight,
  ChevronLeft,
  FileText,
  UserCheck,
} from 'lucide-react';
import { NormalCustodyVault, AsciiGhostMascot } from '../components/AsciiGraphics';

/**
 * Status Tracker Component for Claims
 * Visual stepper: Submitted -> Under Review -> Approved -> Collected
 */
export function ClaimStatusTracker({ claim, handoverInstructions, onCopyCode, copiedCode }) {
  const status = claim?.status || 'submitted';

  const steps = [
    {
      key: 'submitted',
      label: 'Submitted',
      desc: 'Claim logged & locked',
      active: true,
      done: ['submitted', 'needs_info', 'approved', 'collected'].includes(status),
    },
    {
      key: 'under_review',
      label: 'Desk Review',
      desc: status === 'needs_info' ? 'Clarification requested' : 'Security desk verification',
      active: ['submitted', 'needs_info'].includes(status),
      done: ['approved', 'collected'].includes(status),
    },
    {
      key: 'approved',
      label: 'Approved',
      desc: 'Handover code ready',
      active: status === 'approved',
      done: ['approved', 'collected'].includes(status),
    },
    {
      key: 'collected',
      label: 'Collected',
      desc: 'Physical custody transferred',
      active: status === 'collected',
      done: status === 'collected',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Stepper */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-[var(--text-muted)] tracking-wider">
              Verification Lifecycle Status
            </h3>
            <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
              {status === 'approved'
                ? 'Ownership Verified · Ready for Pickup'
                : status === 'collected'
                ? 'Custody Handed Over · Case Closed'
                : status === 'needs_info'
                ? 'Desk Moderator Requested Information'
                : 'Under Review by Security Desk'}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
              status === 'approved'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : status === 'collected'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : status === 'needs_info'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Stepper Progress Bar */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-4 gap-2 relative">
            {steps.map((st, idx) => (
              <div key={st.key} className="flex flex-col items-center text-center relative z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all mb-2 border ${
                    st.done
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-xs'
                      : st.active
                      ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {st.done ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                </div>
                <div className="font-bold text-xs text-[var(--text-primary)]">{st.label}</div>
                <div className="text-[10px] text-[var(--text-muted)] hidden sm:block mt-0.5 max-w-[90px]">
                  {st.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prominent 6-Digit Code Card on Approval */}
      {status === 'approved' && claim.handoverCode && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900 to-black text-white border border-neutral-800 space-y-4 shadow-xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Present at Collection Counter</span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
              OFFICIAL 6-DIGIT HANDOVER CODE
            </h4>
            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-emerald-400 selection:bg-emerald-500/30">
                {claim.handoverCode}
              </span>
              <button
                type="button"
                onClick={() => onCopyCode(claim.handoverCode)}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all border border-neutral-700"
                title="Copy handover code"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 max-w-sm mx-auto leading-relaxed border-t border-neutral-800/80 pt-3">
            Present this code to the custodian desk staff. Entering 5 invalid codes locks physical custody permanently to prevent brute-force attacks.
          </div>
        </div>
      )}

      {/* Needs Info Note from Moderator */}
      {status === 'needs_info' && (
        <div className="p-4 sm:p-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wide">
            <AlertCircle className="w-4 h-4" />
            <span>Moderator Clarification Note:</span>
          </div>
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            {claim.decisionNote || 'Please provide additional details regarding your ownership of this item.'}
          </p>
        </div>
      )}

      {/* Handover Location Instructions */}
      <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
        <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wide">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span>Physical Handover Counter</span>
        </div>
        <p className="text-xs text-[var(--text-primary)] leading-relaxed">
          {handoverInstructions || 'Desk handover at campus security desk or central reception.'}
        </p>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [answers, setAnswers] = useState({});
  const [selectedLostId, setSelectedLostId] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
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

  // Determine total steps for wizard
  // For sensitive items: 1 step per verification prompt + 1 optional link step
  // For non-sensitive: 1 confirmation step
  const wizardQuestions = isSensitive
    ? verificationPrompts.length > 0
      ? verificationPrompts
      : [
          {
            key: 'general_description',
            label: 'Distinctive markings, stickers, engravings, or contents',
            kind: 'text',
          },
        ]
    : [
        {
          key: 'pickup_note',
          label: 'Pickup Note or Timing (Optional)',
          kind: 'text',
        },
      ];

  const totalSteps = wizardQuestions.length + (myLostReports.length > 0 ? 1 : 0);
  const isLastQuestionStep = currentStep === wizardQuestions.length - 1 && myLostReports.length === 0;
  const isLinkLostStep = currentStep === wizardQuestions.length;

  const handleAnswerChange = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmitClaim();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmitClaim = async (e) => {
    if (e) e.preventDefault();
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
        // Privacy-preserving error feedback: Never leak field details
        setError(
          'Someone else is currently verifying a claim on this item. If their claim is declined by desk staff, the item will unlock back to the found feed.'
        );
      } else if (err.status === 429) {
        setError(
          err.message || 'You have reached the maximum allowed verification attempts (3) for this item.'
        );
      } else {
        // Generic failure feedback: wrong answers never indicate which specific field was incorrect
        setError(
          err.message || 'Claim verification failed. Your answers could not be confirmed against custody records.'
        );
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

  /* SUCCESS STATE (CLAIM RESULT WITH STATUS TRACKER) */
  if (claimResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-neutral-100 dark:bg-neutral-900 border border-[var(--border-subtle)] text-[var(--text-muted)]">
            CLAIM RECEIPT · {claimResult.claim?.id?.slice(-8)}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Claim Submission Logged
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            {claimResult.claim?.autoApproved
              ? 'Item auto-approved under standard non-sensitive custody policy.'
              : 'Sensitive item locked for security desk verification.'}
          </p>
        </div>

        <ClaimStatusTracker
          claim={claimResult.claim}
          handoverInstructions={claimResult.handoverInstructions}
          onCopyCode={copyHandoverCode}
          copiedCode={copiedCode}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link
            to={`/o/${slug}/activity`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all text-center"
          >
            Track in My Activity
          </Link>
          <Link
            to={`/o/${slug}/feed`}
            className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  /* CURRENT QUESTION IN WIZARD */
  const activeQuestion = !isLinkLostStep ? wizardQuestions[currentStep] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Top Bar with Back & Badge */}
      <div className="flex items-center justify-between">
        <Link
          to={`/o/${slug}/feed`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)] flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-500" />
            <span>Pre-authenticated as {user?.name}</span>
          </span>
        </div>
      </div>

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

      {/* Error Banner with Privacy-Preserving Messaging */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CLAIM WIZARD (One Question Per Screen with Progress Dots) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Wizard Progress Dots & Step Title */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              {isSensitive ? 'SECURITY VERIFICATION WIZARD' : 'INSTANT CUSTODY CONFIRMATION'}
            </span>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Step {currentStep + 1} of {totalSteps}
            </h2>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <span
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-red-500 scale-125'
                    : idx < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-[var(--border-subtle)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Question Body */}
        {!isLinkLostStep && activeQuestion && (
          <form onSubmit={handleNextStep} className="space-y-6">
            {!isSensitive ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Non-Sensitive Category · Instant Auto-Approval</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    This item qualifies for immediate desk collection without complex challenge questions. Once confirmed, you will receive an official 6-digit handover code.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    {activeQuestion.label}
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={answers[activeQuestion.key] || ''}
                    onChange={(e) => handleAnswerChange(activeQuestion.key, e.target.value)}
                    placeholder="e.g. Will collect today at 4:30 PM from the desk"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[var(--text-primary)]">
                    {activeQuestion.label}
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] uppercase">
                    {activeQuestion.kind === 'secret' ? 'Secret Match (HMAC-SHA256)' : 'Fuzzy Text Similarity'}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {activeQuestion.kind === 'secret'
                    ? 'Enter the exact secret value (serial number, passcode hint, or identification number). Your answer is normalized and evaluated cryptographically without plain-text exposure.'
                    : 'Describe the specific physical feature, stickers, scratches, or unique contents matching this item.'}
                </p>

                <div className="pt-2">
                  <input
                    type="text"
                    autoFocus
                    value={answers[activeQuestion.key] || ''}
                    onChange={(e) => handleAnswerChange(activeQuestion.key, e.target.value)}
                    placeholder={
                      activeQuestion.kind === 'secret'
                        ? 'e.g. Passcode hint, serial digits, or card number'
                        : 'e.g. Mountain sticker on bottom right corner'
                    }
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:border-red-500 transition-colors font-medium shadow-inner"
                  />
                </div>

                <div className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1.5 pt-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privacy guarantee: Wrong answers never reveal stored verification secrets.</span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {currentStep === totalSteps - 1 ? (
                  submitting ? (
                    'Submitting Claim...'
                  ) : (
                    <>
                      <span>Submit Verification Claim</span>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )
                ) : (
                  <>
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Optional Link to Lost Report Step */}
        {isLinkLostStep && (
          <form onSubmit={handleSubmitClaim} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                <FileText className="w-4 h-4 text-red-500" />
                <span>Link to your Lost Report (Optional)</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Connect this claim to your existing lost item query. When desk staff hand over the physical item, your lost report will automatically transition to resolved.
              </p>

              <div className="pt-2">
                <select
                  value={selectedLostId}
                  onChange={(e) => setSelectedLostId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500"
                >
                  <option value="">No linked lost report</option>
                  {myLostReports.map((lr) => (
                    <option key={lr.id} value={lr.id}>
                      {lr.title} ({new Date(lr.occurredFrom).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting Claim...' : 'Complete & Submit Claim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
