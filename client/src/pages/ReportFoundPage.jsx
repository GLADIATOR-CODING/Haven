import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import { api } from '../api/client';
import { useAutosaveDraft } from '../hooks/useAutosaveDraft';
import {
  Camera,
  MapPin,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  X,
  Upload,
  Check,
  Clock,
  Sparkles,
  Smartphone,
  CreditCard,
  Wallet,
  Key,
  Coffee,
  Shirt,
  BookOpen,
  Package,
  Lock,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { AsciiGhostMascot } from '../components/AsciiGraphics';

const COLOR_PALETTE = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'Gray', hex: '#64748b' },
  { name: 'Silver', hex: '#cbd5e1' },
  { name: 'White', hex: '#ffffff', border: true },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Brown', hex: '#78350f' },
];

const TIME_CHIPS = [
  { label: 'Just now', hoursAgo: 0 },
  { label: 'Earlier today', hoursAgo: 4 },
  { label: 'Yesterday', hoursAgo: 24 },
  { label: '2+ days ago', hoursAgo: 48 },
];

const DEFAULT_CATEGORIES = [
  { key: 'electronics', label: 'Phone & Electronics', sensitive: false },
  { key: 'id_card', label: 'ID Card & Documents', sensitive: true },
  { key: 'wallet_bags', label: 'Wallet & Bags', sensitive: true },
  { key: 'keys', label: 'Keys & Access Cards', sensitive: false },
  { key: 'bottles_umbrellas', label: 'Bottles & Umbrellas', sensitive: false },
  { key: 'clothing', label: 'Clothing & Accessories', sensitive: false },
  { key: 'books', label: 'Books & Notebooks', sensitive: false },
  { key: 'other', label: 'Other Items', sensitive: false },
];

const DEFAULT_LOCATIONS = [
  { key: 'library', label: 'Central Library' },
  { key: 'cafeteria', label: 'Main Cafeteria' },
  { key: 'main_gate', label: 'Main Gate Security' },
  { key: 'block_a', label: 'Academic Block A' },
  { key: 'block_b', label: 'Academic Block B' },
  { key: 'sports_complex', label: 'Sports Complex & Gym' },
];

function getCategoryIcon(key) {
  switch (key) {
    case 'electronics':
      return Smartphone;
    case 'id_card':
      return CreditCard;
    case 'wallet_bags':
      return Wallet;
    case 'keys':
      return Key;
    case 'bottles_umbrellas':
      return Coffee;
    case 'clothing':
      return Shirt;
    case 'books':
      return BookOpen;
    default:
      return Package;
  }
}

export default function ReportFoundPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { data: orgData } = useQuery({
    queryKey: ['orgConfig', slug],
    queryFn: () => api.get(`/api/o/${slug}`),
    retry: 1,
  });

  const org = orgData?.org;
  const categories = org?.categories?.length ? org.categories : DEFAULT_CATEGORIES;
  const locations = org?.locations?.length ? org.locations : DEFAULT_LOCATIONS;

  const [draft, setDraft, clearDraft] = useAutosaveDraft(`haven_draft_found_${slug}`, {
    category: '',
    colors: [],
    location: '',
    timeChip: 'Just now',
    title: '',
    description: '',
    privateAnswers: {},
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [error, setError] = useState(null);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    setError(null);
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      setSelectedFile(compressedFile);
      setPhotoPreview(URL.createObjectURL(compressedFile));
    } catch {
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  const removePhoto = () => {
    setSelectedFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleColor = (colorName) => {
    setDraft((prev) => {
      const exists = prev.colors.includes(colorName);
      if (exists) {
        return { ...prev, colors: prev.colors.filter((c) => c !== colorName) };
      }
      if (prev.colors.length >= 2) {
        return { ...prev, colors: [prev.colors[1], colorName] };
      }
      return { ...prev, colors: [...prev.colors, colorName] };
    });
  };

  const selectedCategoryConfig = categories.find((c) => c.key === draft.category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draft.category) {
      setError('Please select an item category.');
      return;
    }
    if (!draft.location) {
      setError('Please select where the item was found.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const hoursAgo = TIME_CHIPS.find((t) => t.label === draft.timeChip)?.hoursAgo || 0;
      const occurredTime = new Date(Date.now() - hoursAgo * 3600000).toISOString();

      const privateDetailsInput = selectedCategoryConfig?.verificationPrompts?.map((p) => ({
        key: p.key,
        label: p.label,
        kind: p.kind,
        value: draft.privateAnswers[p.key] || '',
      })) || [];

      const formData = new FormData();
      formData.append('type', 'found');
      formData.append('category', draft.category);
      formData.append('location', draft.location);
      formData.append('title', draft.title || `${draft.category} item`);
      formData.append('description', draft.description);
      formData.append('colors', JSON.stringify(draft.colors));
      formData.append('occurredFrom', occurredTime);
      formData.append('occurredTo', occurredTime);
      formData.append('privateDetailsInput', JSON.stringify(privateDetailsInput));

      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      const res = await api.post(`/api/o/${slug}/reports`, formData);
      clearDraft();
      setSubmittedReport(res);
    } catch (err) {
      setError(err.message || 'Failed to submit found report.');
    } finally {
      setSubmitting(false);
    }
  };

  /* SUCCESS CONFIRMATION VIEW */
  if (submittedReport) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 sm:p-10 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              REPORT REGISTERED
            </span>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Found Item Logged Successfully
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Thank you for reporting this item. It is now safely registered in the workspace registry.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-left space-y-2.5">
            <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span>Next Step: Physical Custody Drop-off</span>
            </div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
              {org?.handoverInstructions || 'Please deposit the item at the central desk or reception desk so custody can be recorded.'}
            </p>
          </div>

          {submittedReport.status === 'pending_review' && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 text-left flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <span>
                Sensitive Item: Identifying details and photos for this item have been masked to safeguard owner privacy until verification is completed.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate(`/o/${slug}`)}
              className="flex-1 py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
            >
              Back to Workspace Feed
            </button>
            <button
              onClick={() => {
                setSubmittedReport(null);
                setSelectedFile(null);
                setPhotoPreview(null);
              }}
              className="py-2.5 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
            >
              Report Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ACTIVE FOUND REPORT FORM */
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          to={`/o/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {org?.name || 'Workspace'}</span>
        </Link>
        <div className="flex items-center gap-2">
          <AsciiGhostMascot compact />
          <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-2 py-0.5 rounded">
            Fast 45s Log
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          I Found Something
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Record the item details below. Our deterministic matching engine will compare it against reported lost items.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-red-700 dark:text-red-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Multi-Section Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Item Photo Dropzone */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                1. Item Photo (Optional)
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                A clear picture helps the owner identify their property quickly.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>EXIF GPS Stripped</span>
            </span>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {photoPreview ? (
            <div className="relative rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)] h-56 sm:h-64 flex items-center justify-center">
              <img src={photoPreview} alt="Item Preview" className="w-full h-full object-contain" />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-md bg-neutral-900/85 hover:bg-neutral-900 text-white text-xs font-medium backdrop-blur-sm transition-colors"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="p-1.5 rounded-md bg-neutral-900/85 hover:bg-neutral-900 text-white text-xs backdrop-blur-sm transition-colors"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                Cleaned photo ready for match
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 sm:py-10 rounded-lg border-2 border-dashed border-[var(--border-strong)] hover:border-neutral-900 dark:hover:border-neutral-100 bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] transition-all flex flex-col items-center justify-center gap-2.5 text-[var(--text-secondary)] group"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] group-hover:scale-105 transition-transform flex items-center justify-center text-[var(--text-primary)] shadow-sm">
                <Camera className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center space-y-0.5">
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  {compressing ? 'Compressing photo...' : 'Take a Photo or Select an Image'}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  JPEG, PNG, or WEBP under 10MB · Automatically compressed below 500KB
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Section 2: Category Selector */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                2. Category <span className="text-red-500">*</span>
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Pick the item classification for accurate registry matching.
              </p>
            </div>
            {draft.category && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Selected: {categories.find((c) => c.key === draft.category)?.label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {categories.map((cat) => {
              const isSelected = draft.category === cat.key;
              const IconComponent = getCategoryIcon(cat.key);
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setDraft((p) => ({ ...p, category: cat.key }))}
                  className={`p-3.5 rounded-lg text-left transition-all border flex flex-col justify-between min-h-[76px] relative group ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-sm'
                      : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <IconComponent
                      className={`w-4 h-4 ${
                        isSelected
                          ? 'text-white dark:text-neutral-900'
                          : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                      }`}
                    />
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight mt-2">{cat.label}</div>
                    {cat.sensitive && (
                      <span
                        className={`text-[9px] font-mono uppercase inline-block mt-0.5 ${
                          isSelected
                            ? 'text-white/80 dark:text-neutral-700'
                            : 'text-amber-700 dark:text-amber-400 font-semibold'
                        }`}
                      >
                        Sensitive
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Colors */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                3. Primary Colors
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Choose 1 or 2 dominant colors.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {draft.colors.length}/2 selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((color) => {
              const isSelected = draft.colors.includes(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => toggleColor(color.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                    isSelected
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold shadow-sm'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: color.hex,
                      border: color.border ? '1px solid #cbd5e1' : 'none',
                    }}
                  />
                  <span>{color.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Location & Occurrence Window */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
          {/* Where was it found */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  4. Where was it found? <span className="text-red-500">*</span>
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Select the campus zone or room where the item was discovered.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => {
                const isSelected = draft.location === loc.key;
                return (
                  <button
                    key={loc.key}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, location: loc.key }))}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-bold shadow-sm'
                        : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 opacity-70" />
                    <span>{loc.label}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* When was it found */}
          <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                When did you find it?
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Approximate timeframe helps filter matching loss reports.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {TIME_CHIPS.map((chip) => {
                const isSelected = draft.timeChip === chip.label;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, timeChip: chip.label }))}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-bold shadow-sm'
                        : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <Clock className="w-3 h-3 opacity-60" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 5: Dynamic Verification Criteria (for sensitive items) */}
        {selectedCategoryConfig?.verificationPrompts?.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  5. Private Verification Details
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  These details are encrypted and never shown in public listings. They enable the true owner to authenticate their claim.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {selectedCategoryConfig.verificationPrompts.map((prompt) => (
                <div key={prompt.key} className="space-y-1">
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">
                    {prompt.label} {prompt.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={draft.privateAnswers[prompt.key] || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        privateAnswers: {
                          ...prev.privateAnswers,
                          [prompt.key]: e.target.value,
                        },
                      }))
                    }
                    placeholder={
                      prompt.kind === 'secret'
                        ? 'Exact identifier or passcode hint'
                        : 'Distinctive engravings, markings, or details'
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-subtle)] text-xs bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 6: Optional Title & Notes */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                6. Title &amp; Additional Details (Optional)
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Provide an item title or specific physical identifiers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowOptionalDetails((p) => !p)}
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
            >
              <span>{showOptionalDetails ? 'Hide' : 'Add'} Details</span>
              {showOptionalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showOptionalDetails && (
            <div className="space-y-3.5 pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Item Title
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Matte Black Hydro Flask 32oz"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-subtle)] text-xs bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Location Notes or Distinctive Features
                </label>
                <textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Found near table 4 by the east window. Has a small national park sticker on back."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-subtle)] text-xs bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 7: Handover Instructions Notice */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-start gap-3">
          <Building2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
              Physical Custody Handover Desk
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Drop-off point: <strong className="text-[var(--text-primary)]">{org?.handoverInstructions || 'Central Security Desk or Building Reception'}</strong>. Delivering the physical item promptly ensures staff can safeguard it until claimed.
            </p>
          </div>
        </div>

        {/* Section 8: Submit Button */}
        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={submitting || compressing || !draft.category || !draft.location}
            className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Submitting Found Item Report...</span>
            ) : (
              <span>Submit Found Item Report</span>
            )}
          </button>

          {(!draft.category || !draft.location) && (
            <p className="text-center text-[11px] text-[var(--text-muted)]">
              Please choose an item category and found location above to submit.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
