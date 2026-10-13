import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Inbox,
  Lock,
  Plus,
  Search,
  Copy,
  Check,
  Building2,
  Shield,
} from 'lucide-react';

export default function OrgHomePage() {
  const { slug } = useParams();
  const { user, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [copied, setCopied] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const {
    data: orgData,
    isLoading: orgLoading,
    isError: orgError,
    refetch: refetchOrg,
  } = useQuery({
    queryKey: ['orgConfig', slug],
    queryFn: () => api.get(`/api/o/${slug}`),
    retry: 1,
  });

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['foundFeed', slug, selectedCategory],
    queryFn: () =>
      api.get(`/api/o/${slug}/reports/found${selectedCategory ? `?category=${selectedCategory}` : ''}`),
    enabled: !!orgData,
  });

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['myReports', slug],
    queryFn: () => api.get(`/api/o/${slug}/reports/mine`),
    enabled: !!orgData && !!user,
  });

  const copyCode = () => {
    if (orgData?.org?.join?.code) {
      navigator.clipboard.writeText(orgData.org.join.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (orgLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
        <div className="h-28 skeleton-box" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 skeleton-box" />
          <div className="h-20 skeleton-box" />
        </div>
      </div>
    );
  }

  if (orgError || !orgData?.org) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="p-6 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Workspace Unavailable</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            This workspace does not exist or your account needs an invite code to join.
          </p>
          <Link
            to="/join"
            className="px-4 py-2 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold inline-block transition-colors"
          >
            Join with Invite Code
          </Link>
        </div>
      </div>
    );
  }

  const { org, currentRole = 'member' } = orgData;
  const foundItems = feedData?.reports || [];
  const myReports = myData?.reports || [];
  const isDemoOrg = org?.slug?.startsWith('demo-') || ['campus', 'office', 'demo-campus', 'demo-office'].includes(slug);

  const handleSwitchDemoRole = async (targetRole) => {
    setSwitchingRole(true);
    try {
      await demoLogin({ role: targetRole, orgSlug: org.slug });
      await refetchOrg();
    } catch (err) {
      console.error('Role switch failed', err);
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Quick Demo Role Switcher for Evaluators */}
      {isDemoOrg && (
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Demo Workspace Mode
            </span>
            <span className="text-xs text-[var(--text-secondary)] hidden sm:inline">
              · 1-click role testing for evaluators
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-mono text-[var(--text-muted)] mr-1">Switch Role:</span>
            <button
              onClick={() => handleSwitchDemoRole('member')}
              disabled={switchingRole || currentRole === 'member'}
              className={`px-3 py-1 rounded-md font-semibold transition-colors border ${
                currentRole === 'member'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              Member (Alex)
            </button>
            <button
              onClick={() => handleSwitchDemoRole('moderator')}
              disabled={switchingRole || currentRole === 'moderator'}
              className={`px-3 py-1 rounded-md font-semibold transition-colors border ${
                currentRole === 'moderator'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              Moderator (Desk)
            </button>
            <button
              onClick={() => handleSwitchDemoRole('admin')}
              disabled={switchingRole || currentRole === 'admin'}
              className={`px-3 py-1 rounded-md font-semibold transition-colors border ${
                currentRole === 'admin'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              Admin (Campus Admin)
            </button>
          </div>
        </div>
      )}

      {/* Workspace Header Overview Card */}
      <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] uppercase">
              {org.templateKey} WORKSPACE
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold text-red-600 dark:text-red-400 border border-[var(--border-subtle)] bg-[var(--bg-subtle)] uppercase">
              ROLE: {currentRole}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {org.name}
          </h1>

          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 pt-0.5">
            <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>Drop-off Desk: {org.handoverInstructions}</span>
          </p>
        </div>

        {/* Invite Code Quick Box */}
        <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center gap-4 self-start md:self-auto">
          <div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              Access Code
            </div>
            <div className="font-mono text-xl font-extrabold text-[var(--text-primary)] tracking-wider mt-0.5">
              {org.join?.code}
            </div>
          </div>
          <button
            onClick={copyCode}
            className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-sm"
            title="Copy invite code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* I Found Something Card */}
        <Link
          to={`/o/${slug}/report/found`}
          className="p-6 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm hover:shadow flex items-center justify-between group"
        >
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/80">
              Quick 45s Report
            </div>
            <div className="text-xl font-extrabold text-white tracking-tight">
              I Found Something
            </div>
            <div className="text-xs text-white/90">
              Upload photo, choose location, and log found item.
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/20 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
        </Link>

        {/* I Lost Something Card */}
        <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Search & Match
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              I Lost Something
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Describe your item to match against verified custody records.
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-primary)] flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      {org.categories?.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap border ${
              selectedCategory === null
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
            }`}
          >
            All Items
          </button>
          {org.categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
              className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap border ${
                selectedCategory === cat.key
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[var(--border-subtle)] flex gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('feed')}
          className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'feed'
              ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Found Items Feed</span>
          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] font-mono text-[10px]">
            {foundItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'mine'
              ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>My Reports</span>
          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] font-mono text-[10px]">
            {myReports.length}
          </span>
        </button>
      </div>

      {/* FEED CONTENT */}
      {activeTab === 'feed' && (
        <div>
          {feedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 skeleton-box" />
              ))}
            </div>
          ) : foundItems.length === 0 ? (
            <div className="text-center py-16 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-md p-6 space-y-2">
              <div className="w-10 h-10 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-1">
                <Inbox className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                No items reported yet
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Items reported as found will appear in this feed for owners to claim.
              </p>
              <div className="pt-2">
                <Link
                  to={`/o/${slug}/report/found`}
                  className="px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-block transition-colors"
                >
                  Report a Found Item
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {foundItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-[var(--border-strong)] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-subtle)] text-[var(--text-secondary)] uppercase">
                        {item.category}
                      </span>
                      <span className="text-[var(--text-muted)] font-mono text-[10px]">
                        {new Date(item.occurredFrom).toLocaleDateString()}
                      </span>
                    </div>

                    {item.photoMasked ? (
                      <div className="h-36 rounded-lg bg-[var(--bg-subtle)] flex flex-col items-center justify-center text-[var(--text-muted)] text-xs mb-3">
                        <Lock className="w-5 h-5 mb-1 text-red-600" />
                        <span className="font-semibold text-[var(--text-primary)]">
                          Sensitive Item
                        </span>
                        <span className="text-[10px]">Photo masked for privacy</span>
                      </div>
                    ) : item.photo?.url ? (
                      <div className="h-36 rounded-lg bg-[var(--bg-subtle)] overflow-hidden mb-3 border border-[var(--border-subtle)]">
                        <img
                          src={item.photo.url}
                          alt={item.title || item.category}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}

                    <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">
                      {item.title || `${item.category} item`}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
                      <MapPin className="w-3 h-3 text-red-600 flex-shrink-0" />
                      <span className="truncate">Found at: {item.location}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex justify-end">
                    <button
                      onClick={() => alert('Claim verification starts in Phase 2.')}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
                    >
                      Claim Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY REPORTS TAB */}
      {activeTab === 'mine' && (
        <div>
          {myReports.length === 0 ? (
            <div className="text-center py-16 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-md p-6 space-y-1.5">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                No reports submitted yet
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Items you report as lost or found will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myReports.map((item) => (
                <div
                  key={item.id}
                  className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-md p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                        {item.type}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-red-600 dark:text-red-400">
                        {item.status}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-[var(--text-primary)]">
                      {item.title || `${item.category} item`}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {item.location} · {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-[var(--text-muted)] px-2.5 py-1 rounded bg-[var(--bg-subtle)]">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
