import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import { api } from '../api/client';
import { useAutosaveDraft } from '../hooks/useAutosaveDraft';
import MatchCard from '../components/MatchCard';
import {
  Sparkles,
  MapPin,
  Clock,
  Palette,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  X,
  Upload,
  Camera,
  Check,
  Smartphone,
  CreditCard,
  Wallet,
  Key,
  Coffee,
  Shirt,
  BookOpen,
  Package,
  Building2,
  Navigation,
  Shield,
  Search,
  AlertCircle,
} from 'lucide-react';
import { AsciiLostScanner, AsciiGhostMascot } from '../components/AsciiGraphics';

const COLOR_PALETTE = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'Gray', hex: '#64748b' },
  { name: 'Silver', hex: '#cbd5e1' },
  { name: 'White', hex: '#ffffff', border: true },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
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

export default function ReportLostPage() {
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

  const [draft, setDraft, clearDraft] = useAutosaveDraft(`haven_draft_lost_${slug}`, {
    sentence: '',
    category: '',
    colors: [],
    brand: '',
    location: '',
    timeChip: 'Earlier today',
    title: '',
    description: '',
    geo: null,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [parsingQuery, setParsingQuery] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmCard, setShowConfirmCard] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const handleCaptureGeo = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraft((prev) => ({
          ...prev,
          geo: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
          },
        }));
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message || 'Unable to retrieve your location.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleRemoveGeo = () => {
    setDraft((prev) => ({ ...prev, geo: null }));
    setGeoError(null);
  };

  // Auto-analyze sentence on blur or user trigger
  const handleAnalyzeSentence = async (textToParse = draft.sentence) => {
    if (!textToParse || textToParse.trim().length < 4) return;
    setParsingQuery(true);
    try {
      const res = await api.post(`/api/o/${slug}/ai/parse-query`, { sentence: textToParse });
      const parsed = res?.parsed;
      if (parsed) {
        setDraft((prev) => ({
          ...prev,
          category: parsed.category || prev.category || categories[0]?.key || '',
          colors: parsed.colors?.length > 0 ? parsed.colors : prev.colors,
          brand: parsed.brand || prev.brand,
          location: parsed.location || prev.location || locations[0]?.key || '',
          timeChip: parsed.timeChip || prev.timeChip,
          title: parsed.title || prev.title,
          description: parsed.description || prev.description,
        }));
      }
    } catch (err) {
      console.warn('Sentence analysis fallback:', err);
    } finally {
      setParsingQuery(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!draft.category) {
      setError('Please select an item category.');
      return;
    }
    if (!draft.location) {
      setError('Please select where the item was lost.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const hoursAgo = TIME_CHIPS.find((t) => t.label === draft.timeChip)?.hoursAgo || 4;
      const occurredTime = new Date(Date.now() - hoursAgo * 3600000).toISOString();

      const formData = new FormData();
      formData.append('type', 'lost');
      formData.append('category', draft.category);
      formData.append('location', draft.location);
      formData.append('title', draft.title || `${draft.category} item`);
      formData.append('description', draft.description || draft.sentence);
      formData.append('brand', draft.brand || '');
      formData.append('colors', JSON.stringify(draft.colors));
      formData.append('occurredFrom', occurredTime);
      formData.append('occurredTo', new Date().toISOString());

      if (draft.geo) {
        formData.append('geo', JSON.stringify(draft.geo));
      }

      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      const res = await api.post(`/api/o/${slug}/reports`, formData);
      clearDraft();
      setSubmittedResult(res);
    } catch (err) {
      setError(err.message || 'Failed to submit lost report.');
    } finally {
      setSubmitting(false);
    }
  };

  /* POST-SUBMISSION RESULTS VIEW */
  if (submittedResult) {
    const { report, matches = [] } = submittedResult;
    const hasMatches = matches.length > 0;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              REPORT ACTIVE · RADAR LIVE
            </span>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Lost Report Logged
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
              Your report for <span className="font-semibold text-[var(--text-primary)]">{report?.title}</span> is
              now continuously compared against verified found items.
            </p>
          </div>

          {/* Matched Items Section */}
          {hasMatches ? (
            <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Instant Candidate Matches Found</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    We found {matches.length} published item(s) matching your description.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {matches.length} MATCH{matches.length > 1 ? 'ES' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {matches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    orgSlug={slug}
                    showClaimButton={true}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-3 border-t border-[var(--border-subtle)] text-center">
              <AsciiLostScanner />
              <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1">
                <div className="font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Continuous Background Correlation</span>
                </div>
                <p>
                  No matching found items currently in the registry. Our deterministic engine runs
                  automatically whenever any found item is reported at {org?.name || 'the workspace'}.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
            <Link
              to={`/o/${slug}/activity`}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-xs"
            >
              Track in My Activity
            </Link>
            <Link
              to={`/o/${slug}`}
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Back to Workspace Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* REPORT FORM VIEW */
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Back button & Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/o/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
        <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
          UX BUDGET: UNDER 60 SECONDS
        </span>
      </div>

      <div className="space-y-1">
        <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
          REPORT LOST ITEM
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          Describe what you lost.
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Type naturally. Our attribute engine parses your description into structured signals to correlate against found items.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Sentence-First Describe-It Box */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>1. Describe in One Sentence</span>
            </label>
            {parsingQuery && (
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                <span>Analyzing traits...</span>
              </span>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={draft.sentence}
              onChange={(e) => {
                const val = e.target.value;
                setDraft((p) => ({ ...p, sentence: val, description: val }));
              }}
              onBlur={() => handleAnalyzeSentence()}
              placeholder="e.g. Lost my blue Hydro Flask water bottle at Central Library yesterday afternoon"
              className="w-full p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-red-500 transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-[var(--text-muted)]">
              Mention colors, item type, place, or brand for highest match accuracy.
            </span>
            <button
              type="button"
              onClick={() => handleAnalyzeSentence()}
              disabled={parsingQuery || !draft.sentence}
              className="px-3 py-1 rounded bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle-hover)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-primary)] transition-colors disabled:opacity-50"
            >
              Analyze Traits
            </button>
          </div>
        </div>

        {/* Step 2: Interactive Confirm Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                2. Review &amp; Confirm Attributes
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              PRE-FILLED OR ADJUST
            </span>
          </div>

          {/* Category Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Item Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.key);
                const isSelected = draft.category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, category: cat.key }))}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold ring-1 ring-red-500'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colors Swatches */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                Primary Colors (tap up to 2)
              </label>
              {draft.colors.length > 0 && (
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {draft.colors.join(', ')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => {
                const isSelected = draft.colors.includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleColor(c.name)}
                    className={`h-8 px-3 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold scale-105'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Last Seen Location <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {locations.map((loc) => {
                const isSelected = draft.location === loc.key;
                return (
                  <button
                    key={loc.key}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, location: loc.key }))}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold ring-1 ring-red-500'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">{loc.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Geotag GPS Pinpoint */}
            <div className="pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCaptureGeo}
                  disabled={geoLoading}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    draft.geo
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                  <span>{geoLoading ? 'Locating...' : draft.geo ? 'GPS Geotagged' : 'Tag GPS Location'}</span>
                </button>

                {draft.geo && (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    <span>
                      [{draft.geo.lat.toFixed(4)}, {draft.geo.lng.toFixed(4)}] (±{draft.geo.accuracy}m)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveGeo}
                      className="text-[var(--text-muted)] hover:text-red-500 font-bold ml-0.5 text-xs"
                      title="Remove Geotag"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>

              <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
                OPTIONAL EXACT GPS PINPOINT
              </span>
            </div>
            {geoError && (
              <p className="text-[11px] text-red-500 font-medium">{geoError}</p>
            )}
          </div>

          {/* Time Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              When did you lose it?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_CHIPS.map((chip) => {
                const isSelected = draft.timeChip === chip.label;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, timeChip: chip.label }))}
                    className={`py-2 px-3 rounded-lg border text-center text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Title & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Title / Item Name
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Blue Hydro Flask 32oz"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Brand (optional)
              </label>
              <input
                type="text"
                value={draft.brand}
                onChange={(e) => setDraft((p) => ({ ...p, brand: e.target.value }))}
                placeholder="e.g. Apple, Hydro Flask, Nike"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Reference Photo Attachment */}
          <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Reference Photo (Optional)
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Attach an existing photo of your item to assist in matching.
                </div>
              </div>
              {photoPreview ? (
                <div className="flex items-center gap-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-[var(--border-subtle)]"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="text-xs text-red-500 font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={compressing}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subtle-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{compressing ? 'Compressing...' : 'Upload Image'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={submitting || !draft.category || !draft.location}
            className="w-full py-3.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-sm tracking-wide transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Correlating against workspace registry...</span>
            ) : (
              <>
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Submit Lost Report &amp; Scan Matches</span>
              </>
            )}
          </button>

          <p className="text-[11px] font-mono text-[var(--text-muted)] text-center">
            DRAFT AUTOSAVED TO LOCAL BROWSER CACHE
          </p>
        </div>
      </form>
    </div>
  );
}
