import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  GraduationCap,
  Home,
  Briefcase,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  MapPin,
  Tag,
  AlertCircle,
  AtSign,
  X,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

const templates = [
  {
    key: 'campus',
    name: 'Campus / College',
    desc: 'ID cards, phones, notebooks, chargers, and academic library zones.',
    icon: GraduationCap,
  },
  {
    key: 'hostel',
    name: 'Hostel / Dorm',
    desc: 'Room keys, laundry, adapters, and cafeteria mess halls.',
    icon: Home,
  },
  {
    key: 'office',
    name: 'Corporate Office',
    desc: 'RFID badges, laptop docks, meeting rooms, and reception desk.',
    icon: Briefcase,
  },
  {
    key: 'event',
    name: 'Event / Festival',
    desc: 'Passes, jackets, wallets, bags, and stage zones.',
    icon: Calendar,
  },
  {
    key: 'blank',
    name: 'Custom Setup',
    desc: 'Start clean and configure custom categories.',
    icon: Layers,
  },
];

export default function CreateOrgPage() {
  const { user, isLoading, selectOrgSlug, refetchMe } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login?redirect=/orgs/new', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const [step, setStep] = useState(1);
  const [templateKey, setTemplateKey] = useState('campus');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [allowedDomains, setAllowedDomains] = useState(['bits-pilani.ac.in', 'sst.scaler.com', 'scaler.com']);
  const [domainInput, setDomainInput] = useState('');
  const [handoverInstructions, setHandoverInstructions] = useState(
    'Main Security / Reception Desk during operating hours.'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdOrg, setCreatedOrg] = useState(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (user?.email && user.email.includes('@')) {
      const creatorDomain = user.email.split('@')[1].toLowerCase();
      if (!creatorDomain.endsWith('.local')) {
        setAllowedDomains((prev) => (prev.includes(creatorDomain) ? prev : [creatorDomain, ...prev]));
      }
    }
  }, [user]);

  const handleAddDomain = (domToAdd) => {
    const raw = (domToAdd || domainInput).trim().replace(/^@/, '').toLowerCase();
    if (!raw) return;
    if (!allowedDomains.includes(raw)) {
      setAllowedDomains([...allowedDomains, raw]);
    }
    setDomainInput('');
  };

  const handleRemoveDomain = (domToRemove) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domToRemove));
  };

  const handleNameChange = (val) => {
    setName(val);
    if (!createdOrg) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    try {
      const cleanDomains = allowedDomains
        .map((d) => d.replace(/^@/, '').toLowerCase().trim())
        .filter(Boolean);

      const res = await api.post('/api/orgs', {
        name,
        slug: slug || undefined,
        templateKey,
        handoverInstructions,
        allowedDomains: cleanDomains,
      });

      await refetchMe();
      selectOrgSlug(res.org.slug);
      setCreatedOrg(res.org);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (createdOrg?.join?.code) {
      navigator.clipboard.writeText(createdOrg.join.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Checking authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-md p-5 sm:p-7 space-y-6">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-muted)] font-mono">
          <span>STEP 0{Math.min(step, 3)} / 03</span>
          <span className="text-red-600 dark:text-red-400">WORKSPACE SETUP</span>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CHOOSE TEMPLATE & NAME */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                Choose a Workspace Template
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Select a baseline template tailored to your campus or workplace environment.
              </p>
            </div>

            {/* Template Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = templateKey === tpl.key;
                return (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => setTemplateKey(tpl.key)}
                    className={`p-3.5 rounded-md border text-left transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'border-neutral-900 dark:border-neutral-100 bg-[var(--bg-subtle)] font-medium'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">
                        {tpl.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                        {tpl.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide mb-1">
                  Workspace Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Apex Engineering College"
                  className="w-full px-3 py-2 rounded-md border border-[var(--border-subtle)] text-xs bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide mb-1">
                  Workspace URL
                </label>
                <div className="flex items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs">
                  <span className="pl-3 pr-1 text-[var(--text-muted)] font-mono">/o/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-workspace"
                    className="w-full py-2 pr-3 bg-transparent focus:outline-none text-[var(--text-primary)] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="py-2 px-4 rounded-md bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 disabled:opacity-40 text-white dark:text-neutral-900 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW RULES */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                Pre-Configured Categories and Zones
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                The {templateKey} template provisions default categories and zones for your organization.
              </p>
            </div>

            <div className="space-y-3">
              {/* Allowed Member Email Domains */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                    <AtSign className="w-4 h-4 text-emerald-500" />
                    <span>Allowed Member Email Domains</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Specify which email domains are permitted to join this workspace as regular members (e.g. <span className="font-mono text-emerald-500">bits-pilani.ac.in</span> or <span className="font-mono text-emerald-500">sst.scaler.com</span>). Members with these email domains can join without an access code.
                  </p>
                </div>

                {/* Domain Tags List */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  {allowedDomains.length === 0 ? (
                    <span className="text-xs text-[var(--text-muted)] italic">No domains configured yet. All emails will be restricted unless added below.</span>
                  ) : (
                    allowedDomains.map((dom) => (
                      <span
                        key={dom}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono font-medium text-[var(--text-primary)]"
                      >
                        <span className="text-emerald-500 font-bold">@</span>
                        <span>{dom}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDomain(dom)}
                          className="p-0.5 hover:text-red-500 rounded transition-colors"
                          title={`Remove ${dom}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Domain Input & Quick Suggestions */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-[var(--text-muted)] font-mono">@</span>
                    <input
                      type="text"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDomain();
                        }
                      }}
                      placeholder="bits-pilani.ac.in, sst.scaler.com, etc."
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-[var(--border-subtle)] text-xs font-mono bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddDomain()}
                    disabled={!domainInput.trim()}
                    className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 disabled:opacity-40 text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
                  >
                    Add Domain
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[var(--text-muted)]">
                  <span>Quick suggestions:</span>
                  {['bits-pilani.ac.in', 'sst.scaler.com', 'scaler.com', 'gmail.com'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddDomain(sug)}
                      disabled={allowedDomains.includes(sug)}
                      className="px-2 py-0.5 rounded border border-[var(--border-subtle)] hover:border-emerald-500/50 hover:text-emerald-500 disabled:opacity-40 font-mono text-[10px] transition-colors"
                    >
                      +{sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <Tag className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>Configured Categories</span>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px]">
                    Electronics &amp; Laptops
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] text-amber-600 dark:text-amber-400 border border-[var(--border-subtle)] text-[11px]">
                    ID Cards (Sensitive)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px]">
                    Bottles &amp; Containers
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px]">
                    Keys &amp; Badges
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                  <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>Proximity Zoned Locations</span>
                </div>
                <p className="text-[11px]">
                  Locations are zoned so items found in nearby areas match with higher proximity weighting.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2 px-3 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2 px-4 rounded-md bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: HANDOVER DESK */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                Handover Desk Instructions
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Where should finders drop off physical items and where can owners pick them up?
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide mb-1">
                Drop-off Desk Location and Hours <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={handoverInstructions}
                onChange={(e) => setHandoverInstructions(e.target.value)}
                placeholder="e.g. Main Security Desk (Gate 1), 9:00 AM - 6:00 PM."
                className="w-full px-3 py-2 rounded-md border border-[var(--border-subtle)] text-xs bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2 px-3 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={loading || !handoverInstructions.trim()}
                onClick={handleCreate}
                className="py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
              >
                {loading ? 'Creating Workspace...' : 'Launch Workspace'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && createdOrg && (
          <div className="text-center py-6 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                {createdOrg.name} is Live
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Workspace created successfully. You are the workspace administrator.
              </p>
            </div>

            {/* Admin Access Code Card */}
            <div className="p-5 rounded-2xl bg-[var(--bg-subtle)] border-2 border-red-500/30 max-w-md mx-auto text-left space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-500 uppercase tracking-wider">
                  <KeyRound className="w-4 h-4" />
                  <span>ADMIN ACCESS CODE (8-DIGIT)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                  CONFIDENTIAL
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    Workspace Admin Code
                  </div>
                  <div className="font-mono text-2xl font-black text-[var(--text-primary)] tracking-widest mt-0.5">
                    {createdOrg.join?.code}
                  </div>
                </div>
                <button
                  onClick={copyInviteLink}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Private to Workspace Admins:</strong> Do not share this code with regular members. Regular members will join automatically using their verified email domain.
                </span>
              </div>

              {createdOrg.allowedDomains && createdOrg.allowedDomains.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px]">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                    Authorized Member Domains
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {createdOrg.allowedDomains.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-secondary)]">
                        @{d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3">
              <button
                onClick={() => navigate(`/o/${createdOrg.slug}`)}
                className="py-2.5 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-md"
              >
                Enter Workspace Dashboard (/o/{createdOrg.slug})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
