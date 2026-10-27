import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Search,
  MapPin,
  Clock,
  Palette,
  Shield,
  EyeOff,
  ArrowRight,
  Filter,
  Package,
  Smartphone,
  CreditCard,
  Wallet,
  Key,
  Coffee,
  Shirt,
  BookOpen,
  X,
  Sparkles,
} from 'lucide-react';
import { AsciiGhostMascot } from '../components/AsciiGraphics';

const COLOR_OPTIONS = [
  'Black', 'Gray', 'Silver', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Brown',
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

export default function FoundFeedPage() {
  const { slug } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ['orgConfig', slug],
    queryFn: () => api.get(`/api/o/${slug}`),
    retry: 1,
  });

  const org = orgData?.org;

  // Build query string
  const queryParams = new URLSearchParams();
  if (selectedCategory) queryParams.set('category', selectedCategory);
  if (selectedLocation) queryParams.set('location', selectedLocation);
  if (selectedColor) queryParams.set('color', selectedColor);
  if (searchQuery.trim()) queryParams.set('q', searchQuery.trim());

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const {
    data: feedData,
    isLoading: feedLoading,
    refetch,
  } = useQuery({
    queryKey: ['foundFeedFiltered', slug, selectedCategory, selectedLocation, selectedColor, searchQuery],
    queryFn: () => api.get(`/api/o/${slug}/reports/found${queryString}`),
    enabled: !!orgData,
  });

  const { data: myClaimsData } = useQuery({
    queryKey: ['myClaims', slug],
    queryFn: () => api.get(`/api/o/${slug}/claims/mine`),
    enabled: !!orgData,
  });

  const reports = feedData?.reports || [];
  const myClaims = myClaimsData?.claims || [];
  const categories = org?.categories || [];
  const locations = org?.locations || [];

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedLocation(null);
    setSelectedColor(null);
    setSearchQuery('');
  };

  const hasActiveFilters = !!(selectedCategory || selectedLocation || selectedColor || searchQuery);

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-4 sm:space-y-8 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1">
          <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            PUBLIC FOUND FEED
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Verified Found Items
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Items registered and currently in custody or awaiting claim verification at {org?.name || 'this workspace'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/o/${slug}/report/lost`}
            className="px-3.5 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-red-500" />
            <span>Report Lost</span>
          </Link>
          <Link
            to={`/o/${slug}/report/found`}
            className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-xs"
          >
            Log Found Item
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 shadow-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords (e.g. 'AirPods', 'blue bottle', 'Keys', 'Apple')..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-red-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        {categories.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Category</div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap border ${
                  selectedCategory === null
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-bold'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory((prev) => (prev === cat.key ? null : cat.key))}
                  className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap border ${
                    selectedCategory === cat.key
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-bold'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location & Color Chips */}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
          {/* Location Dropdown / Chips */}
          {locations.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Place:</span>
              <select
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value || null)}
                className="px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="">Any Location</option>
                {locations.map((loc) => (
                  <option key={loc.key} value={loc.key}>
                    {loc.label} {loc.zone ? `(${loc.zone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Color filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Color:</span>
            <select
              value={selectedColor || ''}
              onChange={(e) => setSelectedColor(e.target.value || null)}
              className="px-2.5 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="">Any Color</option>
              {COLOR_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-xs text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Item Feed Grid */}
      {feedLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 skeleton-box rounded-xl" />
          ))}
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((item) => {
            const Icon = getCategoryIcon(item.category);
            const isMasked = item.photoMasked;
            const locName = locations.find((l) => l.key === item.location)?.label || item.location;

            return (
              <div
                key={item.id}
                className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden hover:border-[var(--border-strong)] transition-all duration-150 flex flex-col justify-between shadow-xs hover:shadow-md group"
              >
                <div>
                  {/* Image / Thumbnail Container */}
                  <div className="h-44 sm:h-48 w-full bg-[var(--bg-subtle)] relative overflow-hidden flex items-center justify-center border-b border-[var(--border-subtle)]">
                    {item.photo?.url && !isMasked ? (
                      <img
                        src={item.photo.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4 space-y-1.5 text-[var(--text-muted)]">
                        {isMasked ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                              <EyeOff className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400">
                              Photo Masked (Sensitive Item)
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] max-w-[200px]">
                              Verify ownership details to inspect.
                            </span>
                          </>
                        ) : (
                          <>
                            <Icon className="w-10 h-10 opacity-30" />
                            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                              No image attached
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Status Pill on top left */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-black/75 text-white backdrop-blur-xs border border-white/20">
                        {item.category?.replace(/_/g, ' ')}
                      </span>
                      {userClaim && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500 text-black backdrop-blur-xs shadow-xs">
                          CLAIMED BY YOU
                        </span>
                      )}
                      {!userClaim && item.status === 'claim_pending' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500 text-black backdrop-blur-xs shadow-xs">
                          IN CUSTODY
                        </span>
                      )}
                    </div>

                    {/* Time pill top right */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.occurredFrom).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] tracking-tight line-clamp-1">
                      {item.title || `${item.category?.replace(/_/g, ' ')} Item`}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <div className="space-y-1 pt-1 text-xs text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <span className="truncate font-medium text-[var(--text-secondary)]">
                          {locName}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          · {item.locationZone || 'Zone'}
                        </span>
                      </div>

                      {item.colors?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{item.colors.join(', ')}</span>
                          {item.brand && <span className="font-semibold text-[var(--text-primary)]">· {item.brand}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0 border-t border-[var(--border-subtle)] mt-2">
                  <div className="pt-3 flex items-center justify-between">
                    {userClaim ? (
                      <>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {userClaim.status === 'approved' ? `CODE: #${userClaim.handoverCode}` : 'REVIEW PENDING'}
                        </span>
                        <Link
                          to={`/o/${slug}?tab=claims`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          <span>View My Claim</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </>
                    ) : item.status === 'claim_pending' ? (
                      <>
                        <span className="text-[10px] font-mono text-amber-500 font-semibold">
                          PENDING HANDOVER
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] text-xs font-mono font-semibold border border-[var(--border-subtle)] cursor-not-allowed">
                          In Handover
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          CUSTODY VERIFIED
                        </span>
                        <Link
                          to={`/o/${slug}/claim/${item.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-xs"
                        >
                          <span>Claim Item</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6 opacity-50" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              No Published Found Items
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {hasActiveFilters
                ? 'No items matched your current filters. Try resetting search filters or keywords.'
                : 'Nothing reported yet. Be the first to log a found item in this workspace.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-lg bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors"
            >
              Clear All Filters
            </button>
          ) : (
            <Link
              to={`/o/${slug}/report/found`}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-bold inline-block"
            >
              Report Found Item
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
