import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  ArrowRight,
  Sparkles,
  X,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  RotateCw,
  KeyRound,
  Package,
  AtSign,
  ShieldCheck,
} from 'lucide-react';

export default function OrgHomePage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNewlyCreated = searchParams.get('created') === '1';
  const tabParam = searchParams.get('tab');

  const { user, demoLogin, selectOrgSlug } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(tabParam === 'claims' ? 'claims' : 'feed');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [copied, setCopied] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyReason, setApplyReason] = useState('');
  const [applyContact, setApplyContact] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyStatus, setApplyStatus] = useState(null);
  const [rotatingCode, setRotatingCode] = useState(false);
  const [processingReviewId, setProcessingReviewId] = useState(null);
  const [processingReqId, setProcessingReqId] = useState(null);
  const [processingClaimId, setProcessingClaimId] = useState(null);
  const [handoverCodeInput, setHandoverCodeInput] = useState('');
  const [verifyingHandover, setVerifyingHandover] = useState(false);
  const [reviewSubTab, setReviewSubTab] = useState('claims');
  const [editDomains, setEditDomains] = useState([]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [savingDomains, setSavingDomains] = useState(false);
  const [domainsMsg, setDomainsMsg] = useState(null);

  const {
    data: digestData,
    isLoading: digestLoading,
  } = useQuery({
    queryKey: ['analyticsDigest', slug],
    queryFn: () => api.get(`/api/o/${slug}/ai/analytics-digest`),
    enabled: showDigestModal,
  });

  useEffect(() => {
    if (slug) {
      selectOrgSlug(slug);
    }
  }, [slug, selectOrgSlug]);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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

  const userRole = orgData?.currentRole || 'member';
  const isPrivileged = userRole === 'admin' || userRole === 'moderator';

  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useQuery({
    queryKey: ['foundFeed', slug, selectedCategory],
    queryFn: () =>
      api.get(`/api/o/${slug}/reports/found${selectedCategory ? `?category=${selectedCategory}` : ''}`),
    enabled: !!orgData,
  });

  const { data: reviewQueueData, refetch: refetchReviewQueue } = useQuery({
    queryKey: ['reviewQueue', slug],
    queryFn: () => api.get(`/api/o/${slug}/reports/found?status=pending_review`),
    enabled: !!orgData && isPrivileged,
  });

  const { data: deskClaimsData, refetch: refetchDeskClaims } = useQuery({
    queryKey: ['deskClaimsQueue', slug],
    queryFn: () => api.get(`/api/o/${slug}/claims`),
    enabled: !!orgData && isPrivileged,
  });

  const { data: modRequestsData, refetch: refetchModRequests } = useQuery({
    queryKey: ['orgModRequests', slug],
    queryFn: () => api.get(`/api/o/${slug}/moderator-requests`),
    enabled: !!orgData && !!user,
  });

  const { data: allAdminModRequests, refetch: refetchAllAdminModRequests } = useQuery({
    queryKey: ['adminModeratorRequests'],
    queryFn: () => api.get('/api/auth/admin/moderator-requests'),
    enabled: !!user && userRole === 'admin',
  });

  const { data: membersData, refetch: refetchMembers } = useQuery({
    queryKey: ['orgMembers', slug],
    queryFn: () => api.get(`/api/o/${slug}/members`),
    enabled: !!orgData && userRole === 'admin',
  });

  const { data: myData, isLoading: myLoading, refetch: refetchMyReports } = useQuery({
    queryKey: ['myReports', slug],
    queryFn: () => api.get(`/api/o/${slug}/reports/mine`),
    enabled: !!orgData && !!user,
  });

  const { data: myClaimsData, isLoading: myClaimsLoading, refetch: refetchMyClaims } = useQuery({
    queryKey: ['myClaims', slug],
    queryFn: () => api.get(`/api/o/${slug}/claims/mine`),
    enabled: !!orgData && !!user,
  });

  const copyCode = () => {
    if (orgData?.org?.join?.code) {
      navigator.clipboard.writeText(orgData.org.join.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRotateCode = async () => {
    if (!window.confirm('Rotate workspace access code? The old code will immediately stop working for new members.')) {
      return;
    }
    setRotatingCode(true);
    try {
      const res = await api.post(`/api/o/${slug}/invite/rotate`);
      await refetchOrg();
      alert(`Admin access code successfully rotated to: ${res.code}`);
    } catch (err) {
      alert(err.message || 'Failed to rotate code');
    } finally {
      setRotatingCode(false);
    }
  };

  useEffect(() => {
    if (orgData?.org?.allowedDomains) {
      setEditDomains(orgData.org.allowedDomains);
    }
  }, [orgData?.org?.allowedDomains]);

  const handleAddDomainToOrg = () => {
    const clean = newDomainInput.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return;
    if (!editDomains.includes(clean)) {
      setEditDomains([...editDomains, clean]);
    }
    setNewDomainInput('');
  };

  const handleRemoveDomainFromOrg = (dom) => {
    setEditDomains(editDomains.filter((d) => d !== dom));
  };

  const handleSaveAllowedDomains = async () => {
    setSavingDomains(true);
    setDomainsMsg(null);
    try {
      await api.patch(`/api/o/${slug}`, {
        allowedDomains: editDomains,
      });
      await refetchOrg();
      setDomainsMsg({ type: 'success', text: 'Allowed email domains updated successfully!' });
      setTimeout(() => setDomainsMsg(null), 3500);
    } catch (err) {
      setDomainsMsg({ type: 'error', text: err.message || 'Failed to update domains' });
    } finally {
      setSavingDomains(false);
    }
  };

  const handleApplyMod = async (e) => {
    e.preventDefault();
    if (!applyReason.trim()) return;
    setSubmittingApply(true);
    setApplyStatus(null);
    try {
      await api.post(`/api/o/${slug}/moderator-requests`, {
        reason: applyReason,
        contactInfo: applyContact,
      });
      setApplyStatus({ type: 'success', message: 'Application submitted! The workspace admin will review your request.' });
      refetchModRequests();
      setTimeout(() => {
        setShowApplyModal(false);
        setApplyReason('');
        setApplyContact('');
        setApplyStatus(null);
      }, 2000);
    } catch (err) {
      setApplyStatus({ type: 'error', message: err.message || 'Application submission failed.' });
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleReviewReport = async (reportId, action) => {
    setProcessingReviewId(reportId);
    try {
      await api.post(`/api/o/${slug}/reports/${reportId}/review`, { action });
      queryClient.invalidateQueries({ queryKey: ['foundFeed'] });
      queryClient.invalidateQueries({ queryKey: ['reviewQueue'] });
      refetchReviewQueue();
      refetchFeed();
    } catch (err) {
      alert(err.message || 'Review action failed');
    } finally {
      setProcessingReviewId(null);
    }
  };

  const handleReviewModRequest = async (requestId, action, targetOrgSlug = slug) => {
    setProcessingReqId(requestId);
    try {
      await api.patch(`/api/o/${targetOrgSlug}/moderator-requests/${requestId}`, { action });
      refetchModRequests();
      if (refetchAllAdminModRequests) refetchAllAdminModRequests();
      if (refetchMembers) refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['orgConfig'] });
      queryClient.invalidateQueries({ queryKey: ['adminModeratorRequests'] });
      queryClient.invalidateQueries({ queryKey: ['orgModRequests'] });
      queryClient.invalidateQueries({ queryKey: ['orgMembers'] });
    } catch (err) {
      alert(err.message || 'Staff request action failed');
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleReviewClaim = async (claimId, action, decisionNote = '') => {
    setProcessingClaimId(claimId);
    try {
      await api.patch(`/api/o/${slug}/claims/${claimId}/review`, { action, decisionNote });
      refetchDeskClaims();
      refetchFeed();
      refetchMyClaims();
      queryClient.invalidateQueries({ queryKey: ['foundFeed'] });
      queryClient.invalidateQueries({ queryKey: ['deskClaimsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myClaims'] });
    } catch (err) {
      alert(err.message || 'Claim review action failed');
    } finally {
      setProcessingClaimId(null);
    }
  };

  const handleVerifyHandover = async (e) => {
    e?.preventDefault();
    if (!handoverCodeInput.trim()) return;
    setVerifyingHandover(true);
    setHandoverFeedback(null);
    try {
      const res = await api.post(`/api/o/${slug}/claims/handover`, {
        handoverCode: handoverCodeInput.trim(),
      });
      setHandoverFeedback({ success: true, message: res.message || 'Custody successfully handed over to verified owner!' });
      setHandoverCodeInput('');
      refetchDeskClaims();
      refetchFeed();
      refetchMyClaims();
      queryClient.invalidateQueries({ queryKey: ['foundFeed'] });
      queryClient.invalidateQueries({ queryKey: ['deskClaimsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myClaims'] });
    } catch (err) {
      setHandoverFeedback({ success: false, message: err.message || 'Invalid or unapproved pickup code' });
    } finally {
      setVerifyingHandover(false);
    }
  };

  const handleUpdateMemberRole = async (targetUserId, newRole) => {
    try {
      await api.patch(`/api/o/${slug}/members/${targetUserId}`, { role: newRole });
      if (refetchMembers) refetchMembers();
      refetchOrg();
      queryClient.invalidateQueries({ queryKey: ['orgMembers'] });
      queryClient.invalidateQueries({ queryKey: ['orgConfig'] });
    } catch (err) {
      alert(err.message || 'Failed to update member role');
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
  const myClaims = myClaimsData?.claims || [];
  const deskClaims = deskClaimsData?.claims || [];
  const pendingDeskClaims = deskClaims.filter((c) => c.status === 'submitted');
  const approvedDeskClaims = deskClaims.filter((c) => c.status === 'approved');
  const isDemoOrg = org?.slug?.startsWith('demo-') || ['campus', 'office', 'demo-campus', 'demo-office'].includes(slug);
  const pendingModRequests = modRequestsData?.requests?.filter((r) => r.status === 'pending') || [];
  const otherWorkspaceRequests = allAdminModRequests?.requests?.filter(
    (r) => r.status === 'pending' && r.orgId?.slug !== slug
  ) || [];
  const myPendingModReq = modRequestsData?.requests?.find(
    (r) => r.status === 'pending' && (r.userId?._id === user?.id || r.userId === user?.id)
  );

  const handleSwitchDemoRole = async (targetRole) => {
    setSwitchingRole(true);
    try {
      await demoLogin({ role: targetRole, orgSlug: org.slug });
      await refetchOrg();
      await refetchModRequests();
      if (refetchAllAdminModRequests) refetchAllAdminModRequests();
      if (refetchMembers) refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['foundFeed'] });
      queryClient.invalidateQueries({ queryKey: ['reviewQueue'] });
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      queryClient.invalidateQueries({ queryKey: ['myClaims'] });
      queryClient.invalidateQueries({ queryKey: ['deskClaimsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['orgMembers'] });
      queryClient.invalidateQueries({ queryKey: ['adminModeratorRequests'] });
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
              className={`px-3 py-1 rounded-md font-semibold transition-colors border ${currentRole === 'member'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
            >
              Member (Alex)
            </button>
            <button
              onClick={() => handleSwitchDemoRole('moderator')}
              disabled={switchingRole || currentRole === 'moderator'}
              className={`px-3 py-1 rounded-md font-semibold transition-colors border ${currentRole === 'moderator'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
            >
              Moderator (Desk)
            </button>
            <button
              onClick={() => handleSwitchDemoRole('admin')}
              disabled={switchingRole || currentRole === 'admin'}
              className={`px-3 py-1 rounded-md font-semibold transition-colors border ${currentRole === 'admin'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
            >
              Admin (Campus Admin)
            </button>
          </div>
        </div>
      )}

      {/* Newly Created Workspace Banner */}
      {isNewlyCreated && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <strong className="text-sm font-bold text-[var(--text-primary)]">Workspace Successfully Created!</strong>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Your workspace is live. Share the access code <span className="font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">{org.join?.code}</span> with members to invite them.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('created');
              setSearchParams(nextParams, { replace: true });
            }}
            className="text-xs font-semibold hover:underline self-end sm:self-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Workspace Header Overview Card */}
      <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] uppercase">
              {org.templateKey} WORKSPACE
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${currentRole === 'admin'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : currentRole === 'moderator'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                }`}
            >
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

        {/* Header Actions: Access Code, Staff Requests, & AI Operations Digest */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={() => setShowStaffModal(true)}
              className="p-3 sm:px-3.5 sm:py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-amber-500/50 hover:bg-amber-500/10 text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 transition-all shadow-xs relative"
              title="Review Moderator Requests"
            >
              <Users className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Staff Requests</span>
              {pendingModRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-mono font-black ml-1">
                  {pendingModRequests.length}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDigestModal(true)}
            className="p-3 sm:px-3.5 sm:py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 transition-all shadow-xs"
            title="View AI Operations Digest"
          >
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">AI Operations Digest</span>
          </button>

          {/* Admin Access Code Box - Strictly Displayed for Workspace Admins */}
          {currentRole === 'admin' && org.join?.code && (
            <div className="p-3 sm:p-4 rounded-xl bg-[var(--bg-subtle)] border border-red-500/30 flex items-center gap-3 sm:gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-500 uppercase tracking-wider font-bold">
                  <KeyRound className="w-3 h-3" />
                  <span>Admin Access Code (8-Digit)</span>
                </div>
                <div className="font-mono text-base sm:text-xl font-extrabold text-[var(--text-primary)] tracking-wider mt-0.5">
                  {org.join.code}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyCode}
                  className="p-1.5 sm:p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Copy admin access code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleRotateCode}
                  disabled={rotatingCode}
                  className="p-1.5 sm:p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50 text-xs font-semibold text-amber-500 flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
                  title="Rotate 8-digit admin access code"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${rotatingCode ? 'animate-spin text-amber-500' : ''}`} />
                  <span className="hidden sm:inline">{rotatingCode ? 'Rotating...' : 'Rotate'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROLE DIFFERENTIATED DASHBOARD PANELS */}

      {/* 1. ADMIN GOVERNANCE CONSOLE */}
      {currentRole === 'admin' && (
        <div className="space-y-3">
          {pendingModRequests.length > 0 ? (
            <div className="p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <span>ADMIN ACTION REQUIRED: {pendingModRequests.length} DESK STAFF APPLICATION(S)</span>
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Members requested moderator privileges to review quarantined items and verify physical custody.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('staff')}
                  className="text-xs text-amber-500 hover:underline font-semibold"
                >
                  Manage Roster &amp; History →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {pendingModRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {(req.userId?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[var(--text-primary)]">
                            {req.userId?.name || 'Applicant'}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {req.userId?.email} {req.contactInfo ? `· ${req.contactInfo}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        PENDING
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                      "{req.reason}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleReviewModRequest(req._id, 'reject')}
                        disabled={processingReqId === req._id}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleReviewModRequest(req._id, 'approve')}
                        disabled={processingReqId === req._id}
                        className="px-3.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Approve as Moderator</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
                    <span>Workspace Desk Governance</span>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase">
                      All Reviewed
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    No pending moderator applications for {org.name}. Access code: <span className="font-mono font-bold text-[var(--text-primary)]">{org.join?.code}</span> · {membersData?.members?.length || 0} members enrolled.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setActiveTab('staff')}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>Manage Desk Staff &amp; Roster</span>
                </button>
              </div>
            </div>
          )}

          {/* Cross-workspace notice if other workspaces have pending applications */}
          {otherWorkspaceRequests.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Cross-Workspace Notice:</strong> You have {otherWorkspaceRequests.length} pending staff application(s) in other workspaces you manage (<strong>{otherWorkspaceRequests[0].orgId?.name}</strong>).
                </span>
              </div>
              <button
                onClick={() => {
                  selectOrgSlug(otherWorkspaceRequests[0].orgId?.slug);
                  window.location.href = `/o/${otherWorkspaceRequests[0].orgId?.slug}`;
                }}
                className="px-3 py-1 rounded-md bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                Switch to {otherWorkspaceRequests[0].orgId?.name} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. MODERATOR CUSTODY DESK DUTY STRIP */}
      {currentRole === 'moderator' && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-500 dark:text-amber-400 font-mono uppercase text-[11px] flex items-center gap-2">
                <span>Custody Desk Duty Active</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-bold text-[9px]">STAFF</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Drop-off Desk: {org.handoverInstructions}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('review')}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'review'
                ? 'bg-amber-500 text-black border-amber-500 shadow-xs'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Review Quarantined Items ({reviewQueueData?.reports?.length || 0})</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MEMBER PORTAL & VOLUNTEER DESK CALLOUT */}
      {currentRole === 'member' && (
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-900/10 dark:bg-white/10 text-[var(--text-primary)] flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[var(--text-primary)] text-sm">
                Campus Member Portal · {user?.name || 'Student / Member'}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Report lost or found property, track verified custody, and claim matched items below.
              </p>
            </div>
          </div>

          <div>
            {myPendingModReq ? (
              <div className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Application Pending Review by Admin</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setApplyReason('');
                  setApplyContact('');
                  setApplyStatus(null);
                  setShowApplyModal(true);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Apply to be a Desk Moderator</span>
              </button>
            )}
          </div>
        </div>
      )}

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
        <Link
          to={`/o/${slug}/report/lost`}
          className="border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-red-500/50 hover:bg-[var(--bg-subtle)] rounded-xl p-6 flex items-center justify-between shadow-sm transition-all group"
        >
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] group-hover:text-red-500 transition-colors">
              Sentence-First · Under 60s
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              I Lost Something
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Describe your item to match against verified custody records.
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] group-hover:bg-red-500/10 group-hover:text-red-500 text-[var(--text-primary)] flex items-center justify-center flex-shrink-0 transition-colors">
            <Search className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Category Filter Chips */}
      {org.categories?.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap border ${selectedCategory === null
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
              className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap border ${selectedCategory === cat.key
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
      <div className="border-b border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold overflow-x-auto">
        <div className="flex gap-4 sm:gap-6 min-w-max">
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'feed'
              ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
          >
            <span>Found Items Feed</span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] font-mono text-[10px]">
              {foundItems.length}
            </span>
          </button>

          {isPrivileged && (
            <button
              onClick={() => setActiveTab('review')}
              className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'review'
                ? 'border-amber-500 text-amber-500 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-amber-400'
                }`}
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Desk Review Queue</span>
              </span>
              {(reviewQueueData?.reports?.length || 0) + pendingDeskClaims.length > 0 ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono text-[10px] font-bold">
                  {(reviewQueueData?.reports?.length || 0) + pendingDeskClaims.length}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] font-mono text-[10px]">
                  0
                </span>
              )}
            </button>
          )}

          {currentRole === 'admin' && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'staff'
                ? 'border-amber-500 text-amber-500 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-amber-400'
                }`}
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Desk Staff &amp; Roster</span>
              </span>
              {pendingModRequests.length > 0 ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-mono font-bold animate-pulse">
                  {pendingModRequests.length} PENDING
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] font-mono text-[10px]">
                  {membersData?.members?.length || 0}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('claims')}
            className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'claims'
              ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
          >
            <span>My Claims</span>
            <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
              myClaims.length > 0
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
            }`}>
              {myClaims.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mine')}
            className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'mine'
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

        {activeTab === 'feed' ? (
          <Link
            to={`/o/${slug}/feed`}
            className="pb-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 font-medium transition-colors"
          >
            <span>Open Search &amp; Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            to={`/o/${slug}/activity`}
            className="pb-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 font-medium transition-colors"
          >
            <span>My Activity Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
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
              {foundItems.map((item) => {
                const userClaim = myClaims.find((c) => c.foundItem?.id === item.id || c.foundItem?._id === item.id);
                const isClaimPending = item.status === 'claim_pending';

                return (
                  <div
                    key={item.id}
                    className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-[var(--border-strong)] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-subtle)] text-[var(--text-secondary)] uppercase">
                            {item.category}
                          </span>
                          {userClaim && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              CLAIMED BY YOU
                            </span>
                          )}
                          {!userClaim && isClaimPending && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              IN CUSTODY
                            </span>
                          )}
                        </div>
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

                    <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                      {userClaim ? (
                        <>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {userClaim.status === 'approved' ? `CODE: #${userClaim.handoverCode}` : 'REVIEW PENDING'}
                          </span>
                          <button
                            onClick={() => setActiveTab('claims')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>View My Claim</span>
                          </button>
                        </>
                      ) : isClaimPending ? (
                        <>
                          <span className="text-[10px] font-mono text-amber-500 font-semibold">
                            Pending Handover
                          </span>
                          <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] text-xs font-mono font-semibold border border-[var(--border-subtle)] cursor-not-allowed">
                            In Handover
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            AVAILABLE
                          </span>
                          <Link
                            to={`/o/${slug}/claim/${item.id}`}
                            className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors inline-block"
                          >
                            Claim Item
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DESK REVIEW QUEUE TAB (Admins & Desk Moderators) */}
      {activeTab === 'review' && isPrivileged && (
        <div className="space-y-5">
          {/* Desk Header Banner */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-500 dark:text-amber-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                <strong>Custody Desk Station:</strong> Review quarantined items, verify ownership claims on sensitive property, and perform physical code handovers.
              </span>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {pendingDeskClaims.length} Claims
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {reviewQueueData?.reports?.length || 0} Quarantined
              </span>
            </div>
          </div>

          {/* Subtabs for Review Queue */}
          <div className="flex items-center gap-2 pb-1 border-b border-[var(--border-subtle)] text-xs font-semibold">
            <button
              onClick={() => setReviewSubTab('claims')}
              className={`px-3.5 py-1.5 rounded-lg font-mono transition-colors flex items-center gap-1.5 ${
                reviewSubTab === 'claims'
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Pending Claims ({pendingDeskClaims.length})</span>
            </button>
            <button
              onClick={() => setReviewSubTab('intake')}
              className={`px-3.5 py-1.5 rounded-lg font-mono transition-colors flex items-center gap-1.5 ${
                reviewSubTab === 'intake'
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Quarantined Intake ({reviewQueueData?.reports?.length || 0})</span>
            </button>
            <button
              onClick={() => setReviewSubTab('handover')}
              className={`px-3.5 py-1.5 rounded-lg font-mono transition-colors flex items-center gap-1.5 ${
                reviewSubTab === 'handover'
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Handover Code</span>
            </button>
          </div>

          {/* SUBTAB 1: PENDING CLAIMS */}
          {reviewSubTab === 'claims' && (
            <div className="space-y-4">
              {pendingDeskClaims.length === 0 ? (
                <div className="text-center py-16 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-6 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    All Ownership Claims Reviewed
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                    No pending claims waiting for desk moderator review. Newly claimed sensitive items will appear here immediately.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingDeskClaims.map((c) => (
                    <div
                      key={c.id}
                      className="border border-amber-500/40 bg-[var(--bg-card)] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 uppercase">
                            CLAIM UNDER REVIEW
                          </span>
                          <span className="text-[var(--text-muted)] font-mono text-[10px]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Claimant details */}
                        <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
                            {c.claimant?.name?.[0] || 'C'}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[var(--text-primary)]">
                              {c.claimant?.name || 'Claimant User'}
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                              {c.claimant?.email}
                            </div>
                          </div>
                        </div>

                        {/* Item Details */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                            CLAIMED FOUND ITEM:
                          </span>
                          <h4 className="font-bold text-sm text-[var(--text-primary)]">
                            {c.foundItem?.title || `${c.foundItem?.category} item`}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Location: {c.foundItem?.location} · Category: {c.foundItem?.category}
                          </p>
                        </div>

                        {/* Submitted Answers */}
                        {c.answers && c.answers.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">
                              CLAIMANT VERIFICATION ANSWERS:
                            </span>
                            <div className="space-y-1 bg-[var(--bg-subtle)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                              {c.answers.map((a, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {a.label || a.key}:{' '}
                                  </span>
                                  <span className="text-[var(--text-secondary)]">{a.value || '(No answer)'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReviewClaim(c.id, 'reject')}
                          disabled={processingClaimId === c.id}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Decline Claim
                        </button>
                        <button
                          onClick={() => handleReviewClaim(c.id, 'approve')}
                          disabled={processingClaimId === c.id}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Approve Claim</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: QUARANTINED INTAKE */}
          {reviewSubTab === 'intake' && (
            <div>
              {(!reviewQueueData?.reports || reviewQueueData.reports.length === 0) ? (
                <div className="text-center py-16 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-6 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    Quarantined Intake Queue Clear
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    No sensitive items currently awaiting intake approval to the public feed.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reviewQueueData.reports.map((item) => (
                    <div
                      key={item.id}
                      className="border border-amber-500/30 bg-[var(--bg-card)] rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-amber-500/60 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase">
                            QUARANTINED INTAKE
                          </span>
                          <span className="text-[var(--text-muted)] font-mono text-[10px]">
                            {new Date(item.occurredFrom).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="h-32 rounded-lg bg-[var(--bg-subtle)] flex flex-col items-center justify-center text-[var(--text-muted)] text-xs mb-3 border border-amber-500/20">
                          <Lock className="w-5 h-5 mb-1 text-amber-500" />
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.category} (Sensitive)
                          </span>
                          <span className="text-[10px] text-amber-500 font-mono">Quarantined from public feed</span>
                        </div>

                        <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">
                          {item.title || `${item.category} item`}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
                          <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                          <span className="truncate">Reported at: {item.location}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReviewReport(item.id, 'reject')}
                          disabled={processingReviewId === item.id}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleReviewReport(item.id, 'approve')}
                          disabled={processingReviewId === item.id}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Approve to Feed</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: DESK HANDOVER VERIFICATION TOOL */}
          {reviewSubTab === 'handover' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-4 max-w-xl mx-auto shadow-sm">
                <div className="space-y-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Desk Physical Handover Verification
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    When an owner arrives at the drop-off desk with their 6-digit claim code, enter it below to verify and complete physical release.
                  </p>
                </div>

                <form onSubmit={handleVerifyHandover} className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={handoverCodeInput}
                      onChange={(e) => setHandoverCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 482910"
                      className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] font-mono text-center text-lg font-black tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={verifyingHandover || handoverCodeInput.length !== 6}
                      className="px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all disabled:opacity-40 whitespace-nowrap shadow-sm"
                    >
                      {verifyingHandover ? 'Verifying...' : 'Verify & Hand Over'}
                    </button>
                  </div>

                  {handoverFeedback && (
                    <div
                      className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
                        handoverFeedback.success
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      }`}
                    >
                      <span>{handoverFeedback.message}</span>
                      <button onClick={() => setHandoverFeedback(null)} className="font-bold ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* List of Approved Claims Ready for Collection */}
              {approvedDeskClaims.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    APPROVED CLAIMS AWAITING DROP-OFF DESK COLLECTION ({approvedDeskClaims.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {approvedDeskClaims.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl border border-emerald-500/30 bg-[var(--bg-card)] space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-sm tracking-wider">
                            #{c.handoverCode}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {new Date(c.decidedAt || c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {c.foundItem?.title || `${c.foundItem?.category} item`}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          Owner: {c.claimant?.name || 'Verified Member'} ({c.claimant?.email})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MY CLAIMS TAB */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <strong className="text-sm font-bold text-[var(--text-primary)]">My Claimed Items</strong>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Track your active claims, verify ownership statuses, and present 6-digit pickup codes at the drop-off desk.
                </p>
              </div>
            </div>
            <Link
              to={`/o/${slug}/feed`}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline self-start sm:self-auto"
            >
              Browse Found Feed →
            </Link>
          </div>

          {myClaims.length === 0 ? (
            <div className="text-center py-16 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-6 space-y-2">
              <Package className="w-8 h-8 text-[var(--text-muted)] opacity-50 mx-auto" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                No active claims found
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                When you claim an item from the found feed, it will appear here along with its official 6-digit handover code and collection status.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('feed')}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-bold transition-all shadow-xs"
                >
                  Go to Found Feed
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myClaims.map((c) => {
                const isApproved = c.status === 'approved';
                const isSubmitted = c.status === 'submitted';
                const isCollected = c.status === 'collected';
                const isDeclined = c.status === 'rejected';

                return (
                  <div
                    key={c.id}
                    className={`border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between ${
                      isApproved
                        ? 'border-emerald-500/40 bg-[var(--bg-card)]'
                        : isSubmitted
                        ? 'border-amber-500/40 bg-[var(--bg-card)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : isSubmitted
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : isCollected
                              ? 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/30'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                          }`}
                        >
                          {isApproved
                            ? 'CLAIM APPROVED · READY FOR PICKUP'
                            : isSubmitted
                            ? 'UNDER DESK REVIEW'
                            : isCollected
                            ? 'COLLECTED & HANDED OVER ✓'
                            : 'CLAIM DECLINED'}
                        </span>
                        <span className="text-[var(--text-muted)] font-mono text-[10px]">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Item Summary */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                          {c.foundItem?.category}
                        </div>
                        <h4 className="font-bold text-base text-[var(--text-primary)]">
                          {c.foundItem?.title || `${c.foundItem?.category} item`}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span>Found at: {c.foundItem?.location}</span>
                        </p>
                      </div>

                      {/* 6-Digit Handover Code Display (if Approved) */}
                      {isApproved && c.handoverCode && (
                        <div className="p-4 rounded-xl bg-neutral-950 text-white border border-neutral-800 space-y-2 text-center shadow-md">
                          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                            Official 6-Digit Handover Code
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-3xl font-extrabold tracking-widest text-emerald-400">
                              {c.handoverCode}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(c.handoverCode);
                                alert('Handover code copied to clipboard!');
                              }}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                              title="Copy code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            Present this code at {org.handoverInstructions} to claim custody.
                          </p>
                        </div>
                      )}

                      {/* Review Notice (if submitted) */}
                      {isSubmitted && (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Verification In Progress</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            A desk moderator is reviewing your ownership details. Once approved, your 6-digit pickup code will appear right here.
                          </p>
                        </div>
                      )}

                      {/* Declined Note (if rejected) */}
                      {isDeclined && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                          {c.decisionNote || 'Ownership verification details could not be matched by desk staff.'}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span>Drop-off Desk:</span>
                      <span className="font-medium text-[var(--text-primary)] truncate max-w-[220px]">
                        {org.handoverInstructions}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                  className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                        {item.type}
                      </span>

                      {item.status === 'pending_review' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>PENDING DESK REVIEW</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-red-600 dark:text-red-400 font-bold">
                          {item.status}
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      {item.title || `${item.category} item`}
                    </div>

                    {item.status === 'pending_review' && (
                      <p className="text-[11px] text-amber-500/90 font-mono">
                        🛡️ Masked from public feed for privacy. Awaiting workspace custody desk verification.
                      </p>
                    )}

                    <div className="text-[11px] text-[var(--text-muted)] font-mono">
                      Location: {item.location} · {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-[var(--text-muted)] px-2.5 py-1 rounded bg-[var(--bg-subtle)] self-start sm:self-auto">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DESK STAFF & ROSTER TAB (Admin Only) */}
      {activeTab === 'staff' && currentRole === 'admin' && (
        <div className="space-y-6">
          {/* Header & Access Code Card */}
          <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide">
                    Workspace Staff &amp; Moderator Governance
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Review incoming desk applications, elevate members to moderators, and rotate invite codes.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  {membersData?.members?.length || 0} Members Enrolled
                </span>
              </div>
            </div>

            {/* Confidential Admin Access Code Box */}
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-red-500 font-bold tracking-wider">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Admin Access Code (8-Digit) — Confidential</span>
                </div>
                <div className="font-mono text-2xl font-black text-[var(--text-primary)] tracking-widest mt-1">
                  {org.join?.code}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Private to administrators. Anyone using this code at /join gains or claims Admin privileges.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRotateCode}
                  disabled={rotatingCode}
                  className="px-3.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-500 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  title="Generate a new 8-digit admin access code"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${rotatingCode ? 'animate-spin' : ''}`} />
                  <span>{rotatingCode ? 'Rotating...' : 'Rotate Code'}</span>
                </button>
              </div>
            </div>

            {/* Allowed Member Email Domains Management Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide">
                    <AtSign className="w-4 h-4 text-emerald-500" />
                    <span>Allowed Member Email Domains</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {editDomains.length} WHITELISTED
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Regular members join using these authorized email domains (e.g. <span className="font-mono text-emerald-500">bits-pilani.ac.in</span> or <span className="font-mono text-emerald-500">sst.scaler.com</span>). No access code needed for members.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAllowedDomains}
                  disabled={savingDomains}
                  className="self-start sm:self-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {savingDomains ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{savingDomains ? 'Saving...' : 'Save Allowed Domains'}</span>
                </button>
              </div>

              {domainsMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    domainsMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{domainsMsg.text}</span>
                </div>
              )}

              {/* Domains Tags List */}
              <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                {editDomains.length === 0 ? (
                  <span className="text-xs text-[var(--text-muted)] italic">
                    No domains configured. Workspace is currently open to any verified email domain.
                  </span>
                ) : (
                  editDomains.map((dom) => (
                    <span
                      key={dom}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono font-medium text-[var(--text-primary)]"
                    >
                      <span className="text-emerald-500 font-bold">@</span>
                      <span>{dom}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDomainFromOrg(dom)}
                        className="p-0.5 hover:text-red-500 rounded transition-colors"
                        title={`Remove ${dom}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Input & Suggestions */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-[var(--text-muted)] font-mono">@</span>
                  <input
                    type="text"
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDomainToOrg();
                      }
                    }}
                    placeholder="Enter domain (e.g. bits-pilani.ac.in, sst.scaler.com)"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[var(--border-subtle)] text-xs font-mono bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDomainToOrg}
                  disabled={!newDomainInput.trim()}
                  className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 disabled:opacity-40 text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
                >
                  Add Domain
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <span>Quick suggestions:</span>
                {['bits-pilani.ac.in', 'sst.scaler.com', 'scaler.com', 'gmail.com'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      if (!editDomains.includes(sug)) {
                        setEditDomains([...editDomains, sug]);
                      }
                    }}
                    disabled={editDomains.includes(sug)}
                    className="px-2 py-0.5 rounded border border-[var(--border-subtle)] hover:border-emerald-500/50 hover:text-emerald-500 disabled:opacity-40 font-mono text-[10px] transition-colors"
                  >
                    +{sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Applications Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase flex items-center gap-2">
                <span>PENDING DESK STAFF APPLICATIONS</span>
                {pendingModRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-black">
                    {pendingModRequests.length} PENDING
                  </span>
                )}
              </h4>
            </div>

            {pendingModRequests.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-[var(--text-primary)]">All Moderator Applications Reviewed</p>
                <p className="text-[11px] text-[var(--text-secondary)]">No members are currently awaiting desk moderator review for this workspace.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingModRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-xl border border-amber-500/40 bg-[var(--bg-card)] space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {(req.userId?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[var(--text-primary)]">
                            {req.userId?.name || 'Applicant'}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {req.userId?.email} {req.contactInfo ? `· Contact: ${req.contactInfo}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        PENDING REVIEW
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                      "{req.reason}"
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={() => handleReviewModRequest(req._id, 'reject')}
                        disabled={processingReqId === req._id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleReviewModRequest(req._id, 'approve')}
                        disabled={processingReqId === req._id}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Approve as Moderator</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enrolled Workspace Members Roster */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
              WORKSPACE MEMBER ROSTER &amp; ROLE PERMISSIONS
            </h4>

            <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl overflow-hidden divide-y divide-[var(--border-subtle)]">
              {membersData?.members?.map((m) => {
                const isSelf = m.userId === user?.id || m.userId?._id === user?.id;
                return (
                  <div
                    key={m.membershipId}
                    className="p-3.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center text-xs font-mono font-bold">
                        {(m.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          <span>{m.name || 'Unnamed Member'}</span>
                          {isSelf && (
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">(You)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          {m.email} · Joined {new Date(m.joinedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          m.role === 'admin'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                            : m.role === 'moderator'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {m.role}
                      </span>

                      {!isSelf && (
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateMemberRole(m.userId, e.target.value)}
                          className="px-2 py-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-primary)] text-xs focus:outline-none"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* AI Operations Digest Modal */}
      {showDigestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <span>Operations Intelligence Digest</span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      GEMINI 1.5 FLASH
                    </span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Real-time operational recovery velocity and custody hotspots for {org.name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDigestModal(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {digestLoading ? (
              <div className="py-12 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                <div className="text-xs font-mono text-[var(--text-secondary)]">
                  SYNTHESIZING_WORKSPACE_INTELLIGENCE...
                </div>
              </div>
            ) : digestData?.digest ? (
              <div className="space-y-4">
                {/* Headline Banner */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                    OPERATIONAL HEADLINE
                  </div>
                  <h4 className="text-base font-bold text-[var(--text-primary)] mt-1">
                    {digestData.digest.headline}
                  </h4>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Resolution Rate</div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {digestData.digest.metrics?.resolutionRate || '0%'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Found Items</div>
                    <div className="text-lg font-black text-[var(--text-primary)] mt-0.5">
                      {digestData.digest.metrics?.totalFound || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Lost Queries</div>
                    <div className="text-lg font-black text-[var(--text-primary)] mt-0.5">
                      {digestData.digest.metrics?.totalLost || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Reunited</div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {digestData.digest.metrics?.handedOverCount || 0}
                    </div>
                  </div>
                </div>

                {/* Narrative Summary */}
                <div className="space-y-1.5">
                  <h5 className="text-xs font-bold text-[var(--text-primary)]">
                    Operational Assessment
                  </h5>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {digestData.digest.summary}
                  </p>
                </div>

                {/* Hotspots Analysis */}
                {digestData.digest.hotspots && (
                  <div className="space-y-1.5 p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                      <span>Physical Custody Hotspots</span>
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {digestData.digest.hotspots}
                    </p>
                  </div>
                )}

                {/* Desk Recommendations */}
                {digestData.digest.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-[var(--text-primary)]">
                      Actionable Desk Recommendations
                    </h5>
                    <ul className="space-y-1.5">
                      {digestData.digest.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="text-xs text-[var(--text-secondary)] flex items-start gap-2"
                        >
                          <span className="text-emerald-500 font-bold shrink-0">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
                Unable to synthesize intelligence report.
              </div>
            )}

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
              <span>ZERO_LEAK_CONFIDENTIALITY_ENFORCED</span>
              <button
                type="button"
                onClick={() => setShowDigestModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-bold"
              >
                Close Digest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Moderator Applications Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl max-w-xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Custody Desk Staff Applications
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">
                    Review member requests for Moderator privileges in {org.name}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowStaffModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(!modRequestsData?.requests || modRequestsData.requests.length === 0) ? (
              <div className="text-center py-12 border border-[var(--border-subtle)] rounded-lg p-6 space-y-1">
                <Users className="w-6 h-6 text-[var(--text-muted)] mx-auto" />
                <p className="text-xs text-[var(--text-secondary)]">No moderator applications submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {modRequestsData.requests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {(req.userId?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[var(--text-primary)]">
                            {req.userId?.name || 'Applicant'}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {req.userId?.email} {req.contactInfo ? `· ${req.contactInfo}` : ''}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${req.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : req.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] p-2.5 rounded border border-[var(--border-subtle)]">
                      "{req.reason}"
                    </p>

                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleReviewModRequest(req._id, 'reject')}
                          disabled={processingReqId === req._id}
                          className="px-3 py-1.5 rounded text-xs text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleReviewModRequest(req._id, 'approve')}
                          disabled={processingReqId === req._id}
                          className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Approve as Moderator</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowStaffModal(false)}
                className="px-4 py-2 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Apply for Desk Moderator Role
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Apply to verify custody and review sensitive items in {org.name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {applyStatus && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${applyStatus.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}
              >
                {applyStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{applyStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleApplyMod} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Availability &amp; Why You Want to Help <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  placeholder="e.g. I work at the campus student center on weekdays and can help log and verify returned items."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Contact Phone / Student ID (Optional)
                </label>
                <input
                  type="text"
                  value={applyContact}
                  onChange={(e) => setApplyContact(e.target.value)}
                  placeholder="e.g. Student ID #84920 or Ext 204"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply || !applyReason.trim()}
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {submittingApply ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

