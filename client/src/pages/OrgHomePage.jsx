import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
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
  Settings,
  Trash2,
  Edit3,
  Sliders,
  PlusCircle,
  UserMinus,
  ShieldAlert,
  CheckSquare,
  Square,
  Flame,
  BarChart3,
  Lightbulb,
  Layers,
  Radio,
  Download,
  FileSpreadsheet,
  History,
  UserCheck,
  HelpCircle,
} from 'lucide-react';

export default function OrgHomePage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNewlyCreated = searchParams.get('created') === '1';
  const tabParam = searchParams.get('tab');

  const location = useLocation();
  const isSettingsRoute = location.pathname.endsWith('/settings');

  const { user, demoLogin, selectOrgSlug } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(
    isSettingsRoute ? 'settings' : tabParam === 'claims' ? 'claims' : tabParam === 'settings' ? 'settings' : tabParam === 'staff' ? 'staff' : 'feed'
  );
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [copied, setCopied] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [digestSubTab, setDigestSubTab] = useState('trends');
  const [barChartMode, setBarChartMode] = useState('categories'); // 'categories' | 'locations'
  const [trendHoverIdx, setTrendHoverIdx] = useState(null);
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
  const [handoverFeedback, setHandoverFeedback] = useState(null);
  const [reviewSubTab, setReviewSubTab] = useState('claims');
  const [editDomains, setEditDomains] = useState([]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [savingDomains, setSavingDomains] = useState(false);
  const [domainsMsg, setDomainsMsg] = useState(null);

  // Settings State & 6 Sub-Tab Navigation
  const [settingsActiveSubTab, setSettingsActiveSubTab] = useState('general'); // general, categories, locations, policy, members, invite_audit
  const [settingsPlaces, setSettingsPlaces] = useState([]);
  const [settingsCategories, setSettingsCategories] = useState([]);
  const [settingsHandover, setSettingsHandover] = useState('');
  const [settingsName, setSettingsName] = useState('');
  const [settingsExpiryDays, setSettingsExpiryDays] = useState(60);
  const [settingsAiEnabled, setSettingsAiEnabled] = useState(true);
  const [settingsMinDetails, setSettingsMinDetails] = useState(1);
  const [settingsMaxAttempts, setSettingsMaxAttempts] = useState(3);
  const [settingsSensitivity, setSettingsSensitivity] = useState('balanced');
  const [settingsTimeWindow, setSettingsTimeWindow] = useState(72);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState(null);
  const [notice, setNotice] = useState(null);
  const [copiedHandoverClaimId, setCopiedHandoverClaimId] = useState(null);

  // Category verification prompts & keywords editor states
  const [expandedCatKey, setExpandedCatKey] = useState(null);
  const [newPromptLabel, setNewPromptLabel] = useState('');
  const [newPromptKind, setNewPromptKind] = useState('secret');
  const [newPromptRequired, setNewPromptRequired] = useState(true);
  const [newCatKeywordInput, setNewCatKeywordInput] = useState('');

  // Member management & Search state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [updatingMemberId, setUpdatingMemberId] = useState(null);

  // Access Code rotation & copy states
  const [rotateExpiryDays, setRotateExpiryDays] = useState(30);
  const [copiedInviteUrl, setCopiedInviteUrl] = useState(false);

  // New Place input states
  const [newPlaceLabel, setNewPlaceLabel] = useState('');
  const [newPlaceZone, setNewPlaceZone] = useState('main');

  // New Category input states
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatSensitive, setNewCatSensitive] = useState(false);
  const [newCatAutoApprove, setNewCatAutoApprove] = useState(false);

  const handleOpenStaffTab = () => {
    setActiveTab('staff');
    setTimeout(() => {
      const el = document.getElementById('staff-roster-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleOpenSettingsTab = () => {
    setActiveTab('settings');
    setTimeout(() => {
      const el = document.getElementById('settings-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

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
    if (isSettingsRoute) {
      setActiveTab('settings');
    } else if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [isSettingsRoute, tabParam]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

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

  const { data: auditData, isLoading: auditLoading, refetch: refetchAuditLogs } = useQuery({
    queryKey: ['auditLogs', slug],
    queryFn: () => api.get(`/api/o/${slug}/audit/logs?limit=30`),
    enabled: !!orgData && (userRole === 'admin' || userRole === 'moderator'),
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
      navigator.clipboard.writeText(orgData.org.join.code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => setNotice({ type: 'error', text: 'Could not copy the access code. Please select and copy it manually.' }));
    }
  };

  const handleCopyInviteUrl = () => {
    const inviteUrl = `${window.location.origin}/join?code=${orgData?.org?.join?.code || ''}`;
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        setCopiedInviteUrl(true);
        setTimeout(() => setCopiedInviteUrl(false), 2000);
      })
      .catch(() => setNotice({ type: 'error', text: 'Could not copy the invite link. Please copy it from the address bar.' }));
  };

  const handleCopyHandoverCode = (claimId, code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedHandoverClaimId(claimId);
        setTimeout(() => setCopiedHandoverClaimId(null), 2000);
      })
      .catch(() => setNotice({ type: 'error', text: 'Could not copy the handover code. Please enter it manually at the desk.' }));
  };

  const handleRotateCode = async () => {
    if (!window.confirm(`Rotate workspace access code? The current code will be replaced immediately with a new code valid for ${rotateExpiryDays} days.`)) {
      return;
    }
    setRotatingCode(true);
    try {
      const res = await api.post(`/api/o/${slug}/invite/rotate`, { expiresInDays: Number(rotateExpiryDays) });
      await refetchOrg();
      setNotice({ type: 'success', text: `Access code rotated to ${res.code}. It expires in ${rotateExpiryDays} days.` });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to rotate code' });
    } finally {
      setRotatingCode(false);
    }
  };

  useEffect(() => {
    if (orgData?.org?.allowedDomains) {
      setEditDomains(orgData.org.allowedDomains);
    }
    if (orgData?.org) {
      setSettingsPlaces(orgData.org.locations || []);
      setSettingsCategories(orgData.org.categories || []);
      setSettingsHandover(orgData.org.handoverInstructions || '');
      setSettingsName(orgData.org.name || '');
      setSettingsExpiryDays(orgData.org.expiryDays ?? 60);
      setSettingsAiEnabled(orgData.org.aiEnabled !== false);
      setSettingsMinDetails(orgData.org.claimPolicy?.minMatchingDetails ?? 1);
      setSettingsMaxAttempts(orgData.org.claimPolicy?.maxAttempts ?? 3);
      setSettingsSensitivity(orgData.org.matchSensitivity || 'balanced');
      setSettingsTimeWindow(orgData.org.timeWindowHours ?? 72);
    }
  }, [orgData?.org]);

  const handleAddPlace = () => {
    const label = newPlaceLabel.trim();
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    if (settingsPlaces.some((p) => p.key === key)) {
      setNotice({ type: 'error', text: 'A place with a similar name already exists.' });
      return;
    }
    setSettingsPlaces([...settingsPlaces, { key, label, zone: newPlaceZone.trim() || 'main' }]);
    setNewPlaceLabel('');
    setNewPlaceZone('main');
  };

  const handleRemovePlace = (keyToRemove) => {
    if (settingsPlaces.length <= 1) {
      setNotice({ type: 'error', text: 'Workspace must have at least one physical location.' });
      return;
    }
    setSettingsPlaces(settingsPlaces.filter((p) => p.key !== keyToRemove));
  };

  const handleAddCategory = () => {
    const label = newCatLabel.trim();
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    if (settingsCategories.some((c) => c.key === key)) {
      setNotice({ type: 'error', text: 'A category with a similar name already exists.' });
      return;
    }
    setSettingsCategories([
      ...settingsCategories,
      {
        key,
        label,
        icon: 'package',
        keywords: [label.toLowerCase()],
        sensitive: newCatSensitive,
        autoApproveClaims: newCatAutoApprove,
        verificationPrompts: newCatSensitive
          ? [{ key: 'identifier_note', label: 'Identifying marks / unique details', kind: 'text', required: true }]
          : [],
      },
    ]);
    setNewCatLabel('');
    setNewCatSensitive(false);
    setNewCatAutoApprove(false);
  };

  const handleToggleCategorySensitive = (key) => {
    setSettingsCategories(
      settingsCategories.map((c) =>
        c.key === key
          ? {
            ...c,
            sensitive: !c.sensitive,
            autoApproveClaims: !c.sensitive ? false : c.autoApproveClaims,
            verificationPrompts: !c.sensitive
              ? [{ key: 'identifier_note', label: 'Identifying marks / unique details', kind: 'text', required: true }]
              : [],
          }
          : c
      )
    );
  };

  const handleToggleCategoryAutoApprove = (key) => {
    setSettingsCategories(
      settingsCategories.map((c) =>
        c.key === key
          ? {
            ...c,
            autoApproveClaims: !c.autoApproveClaims,
            sensitive: !c.autoApproveClaims ? false : c.sensitive,
          }
          : c
      )
    );
  };

  const handleRemoveCategory = (keyToRemove) => {
    if (settingsCategories.length <= 1) {
      setNotice({ type: 'error', text: 'Workspace must have at least one item category.' });
      return;
    }
    setSettingsCategories(settingsCategories.filter((c) => c.key !== keyToRemove));
  };

  const handleSaveAllSettings = async () => {
    setSettingsSaving(true);
    setSettingsFeedback(null);
    try {
      await api.patch(`/api/o/${slug}`, {
        name: settingsName.trim() || org.name,
        handoverInstructions: settingsHandover.trim() || org.handoverInstructions,
        locations: settingsPlaces,
        categories: settingsCategories,
        allowedDomains: editDomains,
        expiryDays: Number(settingsExpiryDays),
        aiEnabled: !!settingsAiEnabled,
        claimPolicy: {
          minMatchingDetails: Number(settingsMinDetails),
          maxAttempts: Number(settingsMaxAttempts),
        },
        matchSensitivity: settingsSensitivity,
        timeWindowHours: Number(settingsTimeWindow),
      });
      await refetchOrg();
      queryClient.invalidateQueries({ queryKey: ['orgConfig', slug] });
      queryClient.invalidateQueries({ queryKey: ['foundFeed'] });
      setSettingsFeedback({ type: 'success', text: 'All workspace governance settings saved successfully!' });
      setTimeout(() => setSettingsFeedback(null), 4000);
    } catch (err) {
      setSettingsFeedback({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleAddPromptToCategory = (catKey) => {
    const label = newPromptLabel.trim();
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    setSettingsCategories(
      settingsCategories.map((c) => {
        if (c.key !== catKey) return c;
        const currentPrompts = c.verificationPrompts || [];
        if (currentPrompts.some((p) => p.key === key)) {
          setNotice({ type: 'error', text: 'A question with this name already exists in this category.' });
          return c;
        }
        return {
          ...c,
          verificationPrompts: [
            ...currentPrompts,
            { key, label, kind: newPromptKind, required: newPromptRequired },
          ],
        };
      })
    );
    setNewPromptLabel('');
  };

  const handleRemovePromptFromCategory = (catKey, promptKey) => {
    setSettingsCategories(
      settingsCategories.map((c) => {
        if (c.key !== catKey) return c;
        return {
          ...c,
          verificationPrompts: (c.verificationPrompts || []).filter((p) => p.key !== promptKey),
        };
      })
    );
  };

  const handleAddKeywordToCategory = (catKey) => {
    const kw = newCatKeywordInput.trim().toLowerCase();
    if (!kw) return;
    setSettingsCategories(
      settingsCategories.map((c) => {
        if (c.key !== catKey) return c;
        const currentKeywords = c.keywords || [];
        if (currentKeywords.includes(kw)) return c;
        return {
          ...c,
          keywords: [...currentKeywords, kw],
        };
      })
    );
    setNewCatKeywordInput('');
  };

  const handleRemoveKeywordFromCategory = (catKey, kwToRemove) => {
    setSettingsCategories(
      settingsCategories.map((c) => {
        if (c.key !== catKey) return c;
        return {
          ...c,
          keywords: (c.keywords || []).filter((k) => k !== kwToRemove),
        };
      })
    );
  };

  const handleUpdateMemberRole = async (targetUserId, newRole) => {
    setUpdatingMemberId(targetUserId);
    try {
      await api.patch(`/api/o/${slug}/members/${targetUserId}`, { role: newRole });
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['orgMembers', slug] });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to update member role' });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (targetUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName || 'this user'} from the workspace?`)) return;
    setUpdatingMemberId(targetUserId);
    try {
      await api.delete(`/api/o/${slug}/members/${targetUserId}`);
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['orgMembers', slug] });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to remove member' });
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleDownloadAuditCsv = () => {
    window.open(`/api/o/${slug}/audit/export`, '_blank');
  };

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
      setNotice({ type: 'error', text: err.message || 'Review action failed' });
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
      setNotice({ type: 'error', text: err.message || 'Staff request action failed' });
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
      setNotice({ type: 'error', text: err.message || 'Claim review action failed' });
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
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-4 sm:space-y-8 w-full max-w-full overflow-hidden">
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`sticky top-20 z-40 mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-medium shadow-lg ${
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Dismiss notification">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
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

          <div className="w-full sm:w-auto space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:gap-2 text-xs">
            <span className="text-[11px] font-mono text-[var(--text-muted)] block sm:inline">Switch Role:</span>
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center">
              <button
                onClick={() => handleSwitchDemoRole('member')}
                disabled={switchingRole || currentRole === 'member'}
                className={`py-1.5 px-2 rounded-lg font-semibold text-xs text-center transition-colors border ${currentRole === 'member'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
              >
                Member
              </button>
              <button
                onClick={() => handleSwitchDemoRole('moderator')}
                disabled={switchingRole || currentRole === 'moderator'}
                className={`py-1.5 px-2 rounded-lg font-semibold text-xs text-center transition-colors border ${currentRole === 'moderator'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
              >
                Moderator
              </button>
              <button
                onClick={() => handleSwitchDemoRole('admin')}
                disabled={switchingRole || currentRole === 'admin'}
                className={`py-1.5 px-2 rounded-lg font-semibold text-xs text-center transition-colors border ${currentRole === 'admin'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
              >
                Admin
              </button>
            </div>
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
      <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-4 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight break-words">
            {org.name}
          </h1>

          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 pt-0.5">
            <MapPin className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>Drop-off Desk: {org.handoverInstructions}</span>
          </p>
        </div>

        {/* Header Actions: Access Code, Staff Requests, & AI Operations Digest */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={handleOpenSettingsTab}
              className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${activeTab === 'settings'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-red-500/50 hover:bg-red-500/10 text-[var(--text-primary)]'
                }`}
              title="Workspace Settings (Places, Items, Emails)"
            >
              <Settings className="w-4 h-4 text-red-500 shrink-0" />
              <span>Settings</span>
            </button>
          )}

          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={() => setShowStaffModal(true)}
              className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-amber-500/50 hover:bg-amber-500/10 text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 transition-all shadow-xs relative"
              title="Review Moderator Requests"
            >
              <Users className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Staff</span>
              {pendingModRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-mono font-black ml-1">
                  {pendingModRequests.length}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setDigestSubTab('trends');
              setShowDigestModal(true);
            }}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 transition-all shadow-xs"
            title={isPrivileged ? 'View AI Operations & Trends Digest' : 'View Lost & Found Activity Trends'}
          >
            {isPrivileged ? <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" /> : <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />}
            <span>
              {isPrivileged ? 'AI Digest' : 'Activity & Trends'}
            </span>
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
                  onClick={handleOpenStaffTab}
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
                  onClick={handleOpenStaffTab}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* I Found Something Card */}
        <Link
          to={`/o/${slug}/report/found`}
          className="p-4 sm:p-6 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm hover:shadow flex items-center justify-between group"
        >
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/80">
              Quick 45s Report
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              I Found Something
            </div>
            <div className="text-xs text-white/90">
              Upload photo, choose location, and log found item.
            </div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
        </Link>

        {/* I Lost Something Card */}
        <Link
          to={`/o/${slug}/report/lost`}
          className="border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-red-500/50 hover:bg-[var(--bg-subtle)] rounded-xl p-4 sm:p-6 flex items-center justify-between shadow-sm transition-all group"
        >
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] group-hover:text-red-500 transition-colors">
              Sentence-First · Under 60s
            </div>
            <div className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight">
              I Lost Something
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Describe your item to match against verified custody records.
            </div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[var(--bg-subtle)] group-hover:bg-red-500/10 group-hover:text-red-500 text-[var(--text-primary)] flex items-center justify-center flex-shrink-0 transition-colors">
            <Search className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Category Filter Chips */}
      {org.categories?.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap border shrink-0 ${selectedCategory === null
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
              className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap border shrink-0 ${selectedCategory === cat.key
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
      <div className="border-b border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold overflow-x-auto no-scrollbar gap-4 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
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

          {currentRole === 'admin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'settings'
                ? 'border-red-500 text-red-500 dark:border-red-400 dark:text-red-400 font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-red-500'
                }`}
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-red-500" />
                <span>Workspace Settings</span>
              </span>
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
            <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${myClaims.length > 0
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
            <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {pendingDeskClaims.length} Claims
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {reviewQueueData?.reports?.length || 0} Quarantined
              </span>
              <Link
                to={`/o/${slug}/moderation`}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1 transition-colors"
              >
                <span>Desk Terminal</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Subtabs for Review Queue */}
          <div className="flex items-center gap-2 pb-1 border-b border-[var(--border-subtle)] text-xs font-semibold">
            <button
              onClick={() => setReviewSubTab('claims')}
              className={`px-3.5 py-1.5 rounded-lg font-mono transition-colors flex items-center gap-1.5 ${reviewSubTab === 'claims'
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Pending Claims ({pendingDeskClaims.length})</span>
            </button>
            <button
              onClick={() => setReviewSubTab('intake')}
              className={`px-3.5 py-1.5 rounded-lg font-mono transition-colors flex items-center gap-1.5 ${reviewSubTab === 'intake'
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Quarantined Intake ({reviewQueueData?.reports?.length || 0})</span>
            </button>
            <button
              onClick={() => setReviewSubTab('handover')}
              className={`px-3.5 py-1.5 rounded-lg font-mono transition-colors flex items-center gap-1.5 ${reviewSubTab === 'handover'
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
                      className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${handoverFeedback.success
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
                    className={`border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between ${isApproved
                        ? 'border-emerald-500/40 bg-[var(--bg-card)]'
                        : isSubmitted
                          ? 'border-amber-500/40 bg-[var(--bg-card)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
                      }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${isApproved
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
                              onClick={() => handleCopyHandoverCode(c.id, c.handoverCode)}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                              title="Copy code"
                            >
                              {copiedHandoverClaimId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
        <div id="staff-roster-section" className="space-y-6 scroll-mt-20">
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
                  className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${domainsMsg.type === 'success'
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
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${m.role === 'admin'
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

                      {!isSelf && m.role === 'moderator' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Revoke moderator privileges for ${m.name || m.email}? They will return to standard member role.`)) {
                              handleUpdateMemberRole(m.userId, 'member');
                            }
                          }}
                          className="px-2.5 py-1 rounded text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 flex items-center gap-1 transition-colors"
                          title="Demote to regular member"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Remove Moderator</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. WORKSPACE SETTINGS TAB (Admin Only - 6-Tab Governance Hub) */}
      {activeTab === 'settings' && currentRole === 'admin' && (
        <div id="settings-section" className="space-y-6 scroll-mt-20">
          {/* Header Card */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide flex items-center gap-2">
                    <span>Workspace Governance &amp; Admin Hub</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                      ADMIN ONLY
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Configure categories, verification prompts, matching policies, staff roster, and custody audit logs for {org.name}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAllSettings}
                disabled={settingsSaving}
                className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                {settingsSaving ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>{settingsSaving ? 'Saving Changes...' : 'Save All Settings'}</span>
              </button>
            </div>

            {settingsFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2.5 ${settingsFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
              >
                {settingsFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{settingsFeedback.text}</span>
              </div>
            )}

            {/* 6 Sub-Tab Navigation Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--border-subtle)] text-xs font-mono">
              {[
                { id: 'general', label: '1. General & AI', icon: Settings },
                { id: 'categories', label: '2. Categories & Prompts', icon: Package },
                { id: 'locations', label: '3. Places & Zones', icon: MapPin },
                { id: 'policy', label: '4. Policy & Thresholds', icon: ShieldCheck },
                { id: 'members', label: '5. Staff & Members', icon: Users },
                { id: 'audit', label: '6. Invite & Custody Audit', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = settingsActiveSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsActiveSubTab(tab.id)}
                    className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${isActive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUB-TAB 1: GENERAL & AI */}
          {settingsActiveSubTab === 'general' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-5">
              <div className="border-b border-[var(--border-subtle)] pb-3">
                <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide flex items-center gap-2">
                  <Settings className="w-4 h-4 text-red-500" />
                  <span>General Workspace Profile &amp; AI Engine</span>
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Core metadata, drop-off location instructions, item retention duration, and assistive AI switches.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="e.g. Apex Tech Campus"
                    className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">
                    Physical Drop-off Desk Location
                  </label>
                  <input
                    type="text"
                    value={settingsHandover}
                    onChange={(e) => setSettingsHandover(e.target.value)}
                    placeholder="e.g. Campus Security Room 101, Mon-Fri 9am-5pm"
                    className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">
                    Report Expiry / Retention (Days)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={settingsExpiryDays}
                    onChange={(e) => setSettingsExpiryDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    Reports older than this are automatically archived and removed from public feed.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">
                    Matching Time Window (Hours)
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="720"
                    value={settingsTimeWindow}
                    onChange={(e) => setSettingsTimeWindow(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    Temporal window within which lost and found reports are compared.
                  </p>
                </div>
              </div>

              {/* AI Guardrails Switch */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      AI Assistive Parsing &amp; Multimodal Detection
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${settingsAiEnabled
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-neutral-800 text-neutral-400'
                        }`}
                    >
                      {settingsAiEnabled ? 'ENABLED' : 'OFFLINE / KEYWORD FALLBACK'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Enables natural language parsing of describe-it sentences and multimodal photo scans. When disabled or offline, Haven seamlessly falls back to 100% deterministic keyword matching with zero service disruption.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSettingsAiEnabled(!settingsAiEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${settingsAiEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                >
                  {settingsAiEnabled ? 'AI Active' : 'AI Disabled'}
                </button>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: CATEGORIES & VERIFICATION PROMPTS */}
          {settingsActiveSubTab === 'categories' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-5">
              <div className="border-b border-[var(--border-subtle)] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <span>Item Categories &amp; Verification Prompts</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-900/10 dark:bg-white/10 text-[var(--text-primary)] border border-[var(--border-subtle)]">
                      {settingsCategories.length} CATEGORIES
                    </span>
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Define categories, sensitive quarantine rules, search keywords, and HMAC-hashed verification questions for claimant ownership checks.
                  </p>
                </div>
              </div>

              {/* Categories Accordion / Cards List */}
              <div className="space-y-3">
                {settingsCategories.map((cat) => {
                  const isExpanded = expandedCatKey === cat.key;
                  const promptCount = (cat.verificationPrompts || []).length;
                  const keywords = cat.keywords || [];

                  return (
                    <div
                      key={cat.key}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] overflow-hidden"
                    >
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] flex items-center justify-center font-mono font-bold text-xs border border-[var(--border-subtle)]">
                            <Package className="w-4 h-4 text-[var(--text-muted)]" />
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
                              <span>{cat.label}</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono font-normal">({cat.key})</span>
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                              <span>{promptCount} verification {promptCount === 1 ? 'question' : 'questions'}</span>
                              <span>·</span>
                              <span>{keywords.length} keywords</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleCategorySensitive(cat.key)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors flex items-center gap-1.5 border ${cat.sensitive
                                ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                              }`}
                            title="Toggle sensitive quarantine"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{cat.sensitive ? 'Sensitive' : 'Standard'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleCategoryAutoApprove(cat.key)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors flex items-center gap-1.5 border ${cat.autoApproveClaims
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                              }`}
                            title="Toggle auto-approve"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{cat.autoApproveClaims ? 'Auto-Approve' : 'Staff Review'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedCatKey(isExpanded ? null : cat.key)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 transition-colors"
                          >
                            {isExpanded ? 'Close Prompts' : 'Edit Prompts'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat.key)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            title={`Remove category ${cat.label}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section: Verification Prompts & Keywords */}
                      {isExpanded && (
                        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-4">
                          <div>
                            <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase flex items-center justify-between">
                              <span>Verification Prompts (Questions asked during Claim)</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-normal">
                                Secret = HMAC-hashed comparison · Text = Fuzzy similarity
                              </span>
                            </div>

                            <div className="mt-2.5 space-y-2">
                              {(cat.verificationPrompts || []).length === 0 ? (
                                <p className="text-xs text-[var(--text-muted)] italic">
                                  No verification prompts configured for this category yet.
                                </p>
                              ) : (
                                (cat.verificationPrompts || []).map((prompt) => (
                                  <div
                                    key={prompt.key}
                                    className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between gap-2 text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${prompt.kind === 'secret'
                                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                          }`}
                                      >
                                        {prompt.kind === 'secret' ? 'HMAC SECRET' : 'FUZZY TEXT'}
                                      </span>
                                      <span className="font-medium text-[var(--text-primary)]">
                                        {prompt.label}
                                      </span>
                                      {prompt.required && (
                                        <span className="text-[10px] font-mono text-red-500 font-bold">*Required</span>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemovePromptFromCategory(cat.key, prompt.key)}
                                      className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add Prompt Form */}
                            <div className="mt-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-page)] space-y-2">
                              <div className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase">
                                Add Verification Question
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-6">
                                  <input
                                    type="text"
                                    value={newPromptLabel}
                                    onChange={(e) => setNewPromptLabel(e.target.value)}
                                    placeholder="e.g. Serial number, lockscreen wallpaper, engraving"
                                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--text-primary)] focus:outline-none"
                                  />
                                </div>
                                <div className="sm:col-span-3">
                                  <select
                                    value={newPromptKind}
                                    onChange={(e) => setNewPromptKind(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--text-primary)] focus:outline-none"
                                  >
                                    <option value="secret">Secret (HMAC SHA-256)</option>
                                    <option value="text">Text (Token Overlap)</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-3 flex items-center justify-between gap-2">
                                  <label className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={newPromptRequired}
                                      onChange={(e) => setNewPromptRequired(e.target.checked)}
                                      className="rounded text-red-600 focus:ring-0"
                                    />
                                    <span>Required</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleAddPromptToCategory(cat.key)}
                                    disabled={!newPromptLabel.trim()}
                                    className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold disabled:opacity-40"
                                  >
                                    Add Question
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Keywords Manager */}
                          <div className="pt-2 border-t border-[var(--border-subtle)]">
                            <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                              Search Keywords (Deterministic Keyword Matcher)
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {keywords.map((kw) => (
                                <span
                                  key={kw}
                                  className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] font-mono flex items-center gap-1.5"
                                >
                                  <span>{kw}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveKeywordFromCategory(cat.key, kw)}
                                    className="text-[var(--text-muted)] hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="text"
                                value={newCatKeywordInput}
                                onChange={(e) => setNewCatKeywordInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddKeywordToCategory(cat.key);
                                  }
                                }}
                                placeholder="Add keyword (e.g. macbook, airpods, umbrella)"
                                className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none w-64"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddKeywordToCategory(cat.key)}
                                disabled={!newCatKeywordInput.trim()}
                                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold disabled:opacity-40"
                              >
                                + Add Keyword
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add New Category Card */}
              <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-dashed border-[var(--border-subtle)] space-y-3">
                <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">
                  Add New Item Category
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      placeholder="Category name (e.g. Audio Gear, Bicycles, Documents)"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4 flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCatSensitive}
                        onChange={(e) => setNewCatSensitive(e.target.checked)}
                        className="rounded border-[var(--border-subtle)] text-red-600 focus:ring-0"
                      />
                      <span>Sensitive Item</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCatAutoApprove}
                        onChange={(e) => setNewCatAutoApprove(e.target.checked)}
                        className="rounded border-[var(--border-subtle)] text-emerald-600 focus:ring-0"
                      />
                      <span>Auto-Approve</span>
                    </label>
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCatLabel.trim()}
                      className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Category</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: LOCATIONS & ZONES */}
          {settingsActiveSubTab === 'locations' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-4">
              <div className="border-b border-[var(--border-subtle)] pb-3">
                <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Workspace Places &amp; Physical Locations</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-900/10 dark:bg-white/10 text-[var(--text-primary)] border border-[var(--border-subtle)]">
                    {settingsPlaces.length} LOCATIONS
                  </span>
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Locations available when members report found items or search for lost property in this workspace.
                </p>
              </div>

              {/* List of current places */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {settingsPlaces.map((place) => (
                  <div
                    key={place.key}
                    className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-[var(--text-primary)] truncate">{place.label}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">Zone: {place.zone || 'main'}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePlace(place.key)}
                      className="p-1 hover:text-red-500 text-[var(--text-muted)] rounded transition-colors shrink-0"
                      title={`Delete location ${place.label}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new place form */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-page)] border border-dashed border-[var(--border-subtle)] space-y-3">
                <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">
                  Add New Physical Place / Zone
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      value={newPlaceLabel}
                      onChange={(e) => setNewPlaceLabel(e.target.value)}
                      placeholder="Place name (e.g. Science Complex, Library 2nd Floor, Food Court)"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={newPlaceZone}
                      onChange={(e) => setNewPlaceZone(e.target.value)}
                      placeholder="Zone (e.g. academic, dining)"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddPlace}
                      disabled={!newPlaceLabel.trim()}
                      className="w-full h-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Place</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: POLICY & MATCHING THRESHOLDS */}
          {settingsActiveSubTab === 'policy' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-5">
              <div className="border-b border-[var(--border-subtle)] pb-3">
                <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>Matching Sensitivity &amp; Verification Policy</span>
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Control how strictly the deterministic matching engine scores lost and found items, and abuse prevention thresholds.
                </p>
              </div>

              {/* Sensitivity Preset Selector */}
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">
                  Match Sensitivity Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'strict',
                      name: 'Strict Match',
                      score: 'Threshold: 0.80',
                      desc: 'Requires tight temporal and spatial overlap. Minimizes false positives for high-value workplaces.',
                    },
                    {
                      id: 'balanced',
                      name: 'Balanced (Standard)',
                      score: 'Threshold: 0.68',
                      desc: 'Default recommendation. Accommodates partial color or zone matching across active campuses.',
                    },
                    {
                      id: 'lenient',
                      name: 'Lenient / High Recall',
                      score: 'Threshold: 0.55',
                      desc: 'Surfaces tentative matches faster. Great for smaller hostels, gyms, or private events.',
                    },
                  ].map((p) => {
                    const isSelected = settingsSensitivity === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSettingsSensitivity(p.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-md'
                            : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:border-neutral-400'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{p.name}</span>
                          <span className="text-[10px] font-mono opacity-80">{p.score}</span>
                        </div>
                        <p className={`text-[11px] mt-2 leading-relaxed ${isSelected ? 'opacity-90' : 'text-[var(--text-secondary)]'}`}>
                          {p.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Abuse Thresholds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
                    <span>Min Matching Details</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">Current: {settingsMinDetails}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={settingsMinDetails}
                    onChange={(e) => setSettingsMinDetails(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Minimum number of non-category attributes (colors, brand, location) required before a match is flagged.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
                    <span>Max Failed Claim Attempts</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">Current: {settingsMaxAttempts}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settingsMaxAttempts}
                    onChange={(e) => setSettingsMaxAttempts(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Claimants who fail verification this many times are locked out of claiming that specific item to prevent guessing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 5: MEMBERS & ROSTER */}
          {settingsActiveSubTab === 'members' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-4">
              <div className="border-b border-[var(--border-subtle)] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>Workspace Member Roster &amp; Role Management</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-900/10 dark:bg-white/10 text-[var(--text-primary)] border border-[var(--border-subtle)]">
                      {membersData?.members?.length || 0} MEMBERS
                    </span>
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Promote trusted members to Custody Moderators or Workspace Admins, or remove accounts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStaffModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5"
                  >
                    <span>Staff Applications</span>
                    {pendingModRequests.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-mono font-bold">
                        {pendingModRequests.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Member Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Filter members by name or email address..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              {/* Members Table */}
              <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden divide-y divide-[var(--border-subtle)]">
                {(!membersData?.members || membersData.members.length === 0) ? (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                    No members loaded yet.
                  </div>
                ) : (
                  membersData.members
                    .filter((m) => {
                      if (!memberSearchQuery.trim()) return true;
                      const q = memberSearchQuery.toLowerCase();
                      return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
                    })
                    .map((m) => {
                      const isSelf = m.userId === user?.id;
                      const isUpdating = updatingMemberId === m.userId;

                      return (
                        <div
                          key={m.membershipId || m.userId}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {(m.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span>{m.name || 'Member'}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-mono text-emerald-500 font-bold">(You)</span>
                                )}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                                {m.email} · Joined {new Date(m.joinedAt || Date.now()).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <select
                              value={m.role}
                              disabled={isSelf || isUpdating}
                              onChange={(e) => handleUpdateMemberRole(m.userId, e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs font-semibold text-[var(--text-primary)] disabled:opacity-50"
                            >
                              <option value="member">Member</option>
                              <option value="moderator">Desk Moderator</option>
                              <option value="admin">Workspace Admin</option>
                            </select>

                            {!isSelf && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleRemoveMember(m.userId, m.name)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                                title="Remove member from workspace"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 6: INVITE & CUSTODY AUDIT */}
          {settingsActiveSubTab === 'audit' && (
            <div className="space-y-5">
              {/* Access Code & Invite URL Card */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-4">
                <div className="border-b border-[var(--border-subtle)] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-500" />
                      <span>Admin Access Code &amp; Rotation Policy</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Share this 8-digit code or URL with colleagues to grant automated workspace administrative access.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">8-Digit Admin Code</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black font-mono tracking-widest text-[var(--text-primary)]">
                        {orgData?.org?.join?.code || '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={copyCode}
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-semibold flex items-center gap-1.5"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Direct Join URL</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[var(--text-secondary)] truncate max-w-[200px]">
                        {window.location.origin}/join?code={orgData?.org?.join?.code || ''}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyInviteUrl}
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-semibold flex items-center gap-1.5 shrink-0"
                      >
                        {copiedInviteUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedInviteUrl ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Code Rotation Action */}
                <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[var(--text-primary)]">Rotate Access Code Expiry</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Invalidates the previous access code and issues a brand-new 8-digit key.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={rotateExpiryDays}
                      onChange={(e) => setRotateExpiryDays(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs font-mono"
                    >
                      <option value="7">Expires in 7 days</option>
                      <option value="30">Expires in 30 days</option>
                      <option value="90">Expires in 90 days</option>
                      <option value="0">No Expiry (Permanent)</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleRotateCode}
                      disabled={rotatingCode}
                      className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {rotatingCode ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                      <span>Rotate Code</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Accepted Email Domains Whitelist */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide">
                      <AtSign className="w-4 h-4 text-emerald-500" />
                      <span>Accepted Member Email Domains</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {editDomains.length} WHITELISTED
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Users with these verified email domains can automatically join this workspace without an admin invite code.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  {editDomains.length === 0 ? (
                    <span className="text-xs text-[var(--text-muted)] italic">
                      No domains restricted. Workspace is open to any verified email address.
                    </span>
                  ) : (
                    editDomains.map((dom) => (
                      <span
                        key={dom}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-mono font-medium text-[var(--text-primary)] shadow-xs"
                      >
                        <span className="text-emerald-500 font-bold">@</span>
                        <span>{dom}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDomainFromOrg(dom)}
                          className="p-0.5 hover:text-red-500 rounded transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

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
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-[var(--border-subtle)] text-xs font-mono bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDomainToOrg}
                    disabled={!newDomainInput.trim()}
                    className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold disabled:opacity-40"
                  >
                    + Add Domain
                  </button>
                </div>
              </div>

              {/* Immutable Custody Transfer Audit Log & CSV Export Card */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-4">
                <div className="border-b border-[var(--border-subtle)] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide flex items-center gap-2">
                      <History className="w-4 h-4 text-rose-500" />
                      <span>Immutable Custody Transfer Log &amp; Audit Trail</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Cryptographically verifiable and immutable chain of physical property handovers, verification attempts, and moderator decisions.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadAuditCsv}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Download Custody Log (CSV)</span>
                  </button>
                </div>

                {/* Audit Log Table */}
                <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden divide-y divide-[var(--border-subtle)]">
                  {auditLoading ? (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Loading custody transfer records...</span>
                    </div>
                  ) : (!auditData?.logs || auditData.logs.length === 0) ? (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                      No custody transfer events recorded yet.
                    </div>
                  ) : (
                    auditData.logs.map((log) => {
                      const isHandover = log.action === 'HANDOVER_VERIFIED';
                      const isApproved = log.action === 'CLAIM_APPROVED';
                      const isLockout = log.action === 'HANDOVER_LOCKED_ABUSE';
                      const isRejected = log.action === 'CLAIM_REJECTED';

                      return (
                        <div
                          key={log._id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isHandover
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                  : isApproved
                                    ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                                    : isLockout
                                      ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                                      : isRejected
                                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                                }`}
                            >
                              {log.action}
                            </span>
                            <div>
                              <div className="font-semibold text-[var(--text-primary)]">
                                {log.actor?.name || 'Staff Moderator'}
                                <span className="text-[10px] font-mono text-[var(--text-muted)] font-normal ml-1.5">
                                  ({log.actor?.email})
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-[var(--text-muted)]">
                                Target: {log.targetType} #{String(log.targetId).slice(-6)}
                              </div>
                            </div>
                          </div>

                          <div className="text-right text-[11px] font-mono text-[var(--text-muted)]">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Save Action */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between shadow-md">
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Ready to commit workspace changes?</div>
              <div className="text-[11px] text-[var(--text-secondary)]">All places, item categories, policy presets, and email domains will update immediately.</div>
            </div>
            <button
              type="button"
              onClick={handleSaveAllSettings}
              disabled={settingsSaving}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              {settingsSaving ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{settingsSaving ? 'Saving Changes...' : 'Save Workspace Settings'}</span>
            </button>
          </div>
        </div>
      )}


      {/* AI Operations Digest Modal */}
      {showDigestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-4xl w-full p-5 sm:p-7 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                  {isPrivileged ? <Sparkles className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {isPrivileged ? 'Operational Intelligence & Trends' : 'Lost & Found Activity Trends'}
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${isPrivileged
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                    >
                      {isPrivileged ? 'STAFF & ADMIN VIEW · CONFIDENTIAL' : 'COMMUNITY VIEW'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {isPrivileged
                      ? `7-day activity velocity, spatial loss distribution, and facility asset protection protocols for ${org.name}.`
                      : `Weekly lost & found activity, item trends, and tips for safeguarding belongings in ${org.name}.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setShowDigestModal(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-Tab Navigation Bar */}
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDigestSubTab('trends')}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${digestSubTab === 'trends'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                  }`}
              >
                {isPrivileged ? <BarChart3 className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                <span>{isPrivileged ? 'Visual Analytics & Trend Graphs' : 'Activity Trends & Charts'}</span>
              </button>

              {isPrivileged ? (
                <button
                  type="button"
                  onClick={() => setDigestSubTab('playbook')}
                  className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${digestSubTab === 'playbook'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                    }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Asset Protection &amp; Safety Playbook</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDigestSubTab('tips')}
                  className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${digestSubTab === 'tips'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                    }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Safe Campus Tips</span>
                </button>
              )}
            </div>

            {digestLoading ? (
              <div className="py-20 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                <div className="text-xs font-mono text-[var(--text-secondary)]">
                  SYNTHESIZING_WORKSPACE_OPERATIONS_INTELLIGENCE...
                </div>
                <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                  Aggregating location distributions, loss frequencies, and formulating organizational safety playbooks.
                </p>
              </div>
            ) : digestData?.digest ? (
              (() => {
                const digest = digestData.digest;
                const metrics = digest.metrics || {};
                const mostLostLoc = metrics.mostLostLocation || { label: 'Campus Central', lostCount: 0, percentOfLost: 0, zone: 'main' };
                const mostLostCat = metrics.mostLostCategory || { label: 'General Property', lostCount: 0, percentOfLost: 0, sensitive: false };
                const locationStats = metrics.locationStats || [];
                const categoryStats = metrics.categoryStats || [];
                const dailyTrend = metrics.dailyTrend || [];

                // Render SVG Trend Line Chart
                const renderTrendLineChart = () => {
                  const data = dailyTrend.length > 0 ? dailyTrend : [
                    { dayLabel: 'Mon', lostCount: 0, foundCount: 0 },
                    { dayLabel: 'Tue', lostCount: 0, foundCount: 0 },
                    { dayLabel: 'Wed', lostCount: 0, foundCount: 0 },
                    { dayLabel: 'Thu', lostCount: 0, foundCount: 0 },
                    { dayLabel: 'Fri', lostCount: 0, foundCount: 0 },
                    { dayLabel: 'Sat', lostCount: 0, foundCount: 0 },
                    { dayLabel: 'Sun', lostCount: 0, foundCount: 0 },
                  ];

                  const maxVal = Math.max(4, ...data.map((d) => Math.max(d.lostCount || 0, d.foundCount || 0)));
                  const yTicks = [0, Math.ceil(maxVal * 0.33), Math.ceil(maxVal * 0.66), maxVal];

                  const width = 640;
                  const height = 210;
                  const padLeft = 32;
                  const padRight = 24;
                  const padTop = 20;
                  const padBottom = 32;
                  const chartW = width - padLeft - padRight;
                  const chartH = height - padTop - padBottom;

                  const getX = (i) => padLeft + (i / Math.max(1, data.length - 1)) * chartW;
                  const getY = (val) => padTop + chartH - ((val || 0) / maxVal) * chartH;

                  const buildSmoothPath = (key) => {
                    if (!data.length) return '';
                    const points = data.map((d, i) => ({ x: getX(i), y: getY(d[key]) }));
                    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
                    let p = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 0; i < points.length - 1; i++) {
                      const p0 = points[i];
                      const p1 = points[i + 1];
                      const mx = (p0.x + p1.x) / 2;
                      p += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
                    }
                    return p;
                  };

                  const buildAreaPath = (key) => {
                    const line = buildSmoothPath(key);
                    if (!line) return '';
                    const lastX = getX(data.length - 1);
                    const firstX = getX(0);
                    const bottomY = padTop + chartH;
                    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
                  };

                  const lostLine = buildSmoothPath('lostCount');
                  const lostArea = buildAreaPath('lostCount');
                  const foundLine = buildSmoothPath('foundCount');
                  const foundArea = buildAreaPath('foundCount');

                  const activePoint = trendHoverIdx !== null && data[trendHoverIdx] ? data[trendHoverIdx] : null;

                  return (
                    <div className="relative w-full overflow-hidden">
                      <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-auto overflow-visible select-none"
                        onMouseLeave={() => setTrendHoverIdx(null)}
                      >
                        <defs>
                          <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="foundGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        {yTicks.map((tickVal, idx) => {
                          const y = getY(tickVal);
                          return (
                            <g key={idx}>
                              <line
                                x1={padLeft}
                                y1={y}
                                x2={padLeft + chartW}
                                y2={y}
                                stroke="currentColor"
                                strokeOpacity="0.12"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={padLeft - 8}
                                y={y + 3.5}
                                textAnchor="end"
                                className="fill-[var(--text-muted)] text-[10px] font-mono"
                              >
                                {tickVal}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Fills */}
                        <path d={lostArea} fill="url(#lostGrad)" />
                        <path d={foundArea} fill="url(#foundGrad)" />

                        {/* Lines */}
                        <path
                          d={lostLine}
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d={foundLine}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Hover guideline */}
                        {trendHoverIdx !== null && (
                          <line
                            x1={getX(trendHoverIdx)}
                            y1={padTop}
                            x2={getX(trendHoverIdx)}
                            y2={padTop + chartH}
                            stroke="currentColor"
                            strokeOpacity="0.3"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Data points & X Labels */}
                        {data.map((d, i) => {
                          const x = getX(i);
                          const lostY = getY(d.lostCount);
                          const foundY = getY(d.foundCount);
                          const isHovered = trendHoverIdx === i;

                          return (
                            <g key={i}>
                              {/* Lost Point */}
                              <circle
                                cx={x}
                                cy={lostY}
                                r={isHovered ? 5.5 : 3.5}
                                fill="#EF4444"
                                stroke="var(--bg-card)"
                                strokeWidth={isHovered ? 2 : 1.5}
                                className="transition-all duration-150"
                              />

                              {/* Found Point */}
                              <circle
                                cx={x}
                                cy={foundY}
                                r={isHovered ? 5.5 : 3.5}
                                fill="#10B981"
                                stroke="var(--bg-card)"
                                strokeWidth={isHovered ? 2 : 1.5}
                                className="transition-all duration-150"
                              />

                              {/* X Axis Label */}
                              <text
                                x={x}
                                y={padTop + chartH + 18}
                                textAnchor="middle"
                                className={`text-[10px] font-mono transition-colors ${isHovered
                                    ? 'fill-[var(--text-primary)] font-bold'
                                    : 'fill-[var(--text-muted)]'
                                  }`}
                              >
                                {d.dayLabel}
                              </text>

                              {/* Mouse capture area */}
                              <rect
                                x={x - chartW / (data.length * 2)}
                                y={padTop}
                                width={chartW / Math.max(1, data.length)}
                                height={chartH + 20}
                                fill="transparent"
                                onMouseEnter={() => setTrendHoverIdx(i)}
                                className="cursor-pointer"
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* Floating Tooltip */}
                      {activePoint && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-strong)] shadow-md text-[11px] font-mono flex items-center gap-3.5 z-10 animate-in fade-in zoom-in-95 duration-100">
                          <span className="font-bold text-[var(--text-primary)]">
                            {activePoint.fullLabel || activePoint.date}
                          </span>
                          <span className="text-red-500 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                            {activePoint.lostCount} Lost
                          </span>
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            {activePoint.foundCount} Found
                          </span>
                        </div>
                      )}
                    </div>
                  );
                };

                // Render SVG Grouped Column Bar Chart
                const renderGroupedBarChart = (items) => {
                  const displayItems = (items || []).slice(0, 5);
                  if (!displayItems.length) {
                    return (
                      <div className="py-12 text-center text-xs text-[var(--text-muted)] italic">
                        No records available for breakdown yet.
                      </div>
                    );
                  }

                  const maxVal = Math.max(3, ...displayItems.map((d) => Math.max(d.lostCount || 0, d.foundCount || 0)));
                  const yTicks = [0, Math.ceil(maxVal * 0.5), maxVal];

                  const width = 640;
                  const height = 190;
                  const padLeft = 32;
                  const padRight = 20;
                  const padTop = 22;
                  const padBottom = 34;
                  const chartW = width - padLeft - padRight;
                  const chartH = height - padTop - padBottom;

                  const groupWidth = chartW / displayItems.length;
                  const barWidth = Math.min(22, Math.max(12, (groupWidth - 28) / 2));

                  return (
                    <div className="w-full overflow-hidden">
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                        {/* Horizontal Grid lines */}
                        {yTicks.map((tickVal, idx) => {
                          const y = padTop + chartH - (tickVal / maxVal) * chartH;
                          return (
                            <g key={idx}>
                              <line
                                x1={padLeft}
                                y1={y}
                                x2={padLeft + chartW}
                                y2={y}
                                stroke="currentColor"
                                strokeOpacity="0.12"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={padLeft - 8}
                                y={y + 3.5}
                                textAnchor="end"
                                className="fill-[var(--text-muted)] text-[10px] font-mono"
                              >
                                {tickVal}
                              </text>
                            </g>
                          );
                        })}

                        {/* Grouped Bars */}
                        {displayItems.map((item, i) => {
                          const groupCenterX = padLeft + i * groupWidth + groupWidth / 2;
                          const lostBarHeight = ((item.lostCount || 0) / maxVal) * chartH;
                          const foundBarHeight = ((item.foundCount || 0) / maxVal) * chartH;

                          const lostX = groupCenterX - barWidth - 2;
                          const foundX = groupCenterX + 2;

                          const lostY = padTop + chartH - lostBarHeight;
                          const foundY = padTop + chartH - foundBarHeight;

                          return (
                            <g key={item.key || i} className="group">
                              {/* Lost Bar */}
                              <rect
                                x={lostX}
                                y={lostY}
                                width={barWidth}
                                height={Math.max(2, lostBarHeight)}
                                rx="3"
                                className="fill-red-500 transition-all duration-300 hover:opacity-80"
                              />
                              {item.lostCount > 0 && (
                                <text
                                  x={lostX + barWidth / 2}
                                  y={lostY - 4}
                                  textAnchor="middle"
                                  className="fill-red-500 font-mono text-[9px] font-bold"
                                >
                                  {item.lostCount}
                                </text>
                              )}

                              {/* Found Bar */}
                              <rect
                                x={foundX}
                                y={foundY}
                                width={barWidth}
                                height={Math.max(2, foundBarHeight)}
                                rx="3"
                                className="fill-emerald-500 transition-all duration-300 hover:opacity-80"
                              />
                              {item.foundCount > 0 && (
                                <text
                                  x={foundX + barWidth / 2}
                                  y={foundY - 4}
                                  textAnchor="middle"
                                  className="fill-emerald-500 font-mono text-[9px] font-bold"
                                >
                                  {item.foundCount}
                                </text>
                              )}

                              {/* Label */}
                              <text
                                x={groupCenterX}
                                y={padTop + chartH + 16}
                                textAnchor="middle"
                                className="fill-[var(--text-secondary)] text-[10px] font-medium truncate"
                              >
                                {item.label && item.label.length > 14 ? item.label.slice(0, 12) + '…' : item.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                };

                return (
                  <div className="space-y-6">
                    {/* TAB 1: VISUAL ANALYTICS & TRENDS */}
                    {digestSubTab === 'trends' && (
                      <div className="space-y-6">
                        {/* Summary & Velocity Card */}
                        <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{isPrivileged ? 'OPERATIONAL ASSESSMENT' : 'COMMUNITY HIGHLIGHT'}</span>
                            </div>
                            <h4 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                              {digest.headline}
                            </h4>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              {digest.summary}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                            <div className="text-center px-2">
                              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Resolution Rate</div>
                              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {metrics.resolutionRate || '0%'}
                              </div>
                            </div>
                            <div className="h-8 w-px bg-[var(--border-subtle)]" />
                            <div className="text-center px-2">
                              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Total Reunited</div>
                              <div className="text-xl font-black text-[var(--text-primary)] mt-0.5">
                                {metrics.handedOverCount || 0}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* GRAPH 1: ACTUAL 7-DAY ACTIVITY TREND (DUAL LINE CHART) */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
                            <div>
                              <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 font-mono uppercase">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span>7-Day Activity Velocity Trend</span>
                              </h5>
                              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                                Comparing daily lost item inquiries against reported and secured found property.
                              </p>
                            </div>

                            {/* Chart Legend */}
                            <div className="flex items-center gap-4 text-[11px] font-mono">
                              <span className="flex items-center gap-1.5 font-semibold text-red-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                                <span>Lost Reports ({metrics.totalLost || 0})</span>
                              </span>
                              <span className="flex items-center gap-1.5 font-semibold text-emerald-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                <span>Found Items ({metrics.totalFound || 0})</span>
                              </span>
                            </div>
                          </div>

                          {/* Line Chart Component */}
                          {renderTrendLineChart()}
                        </div>

                        {/* GRAPH 2: ACTUAL GROUPED BAR CHART (CATEGORIES OR LOCATIONS) */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                            <div>
                              <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 font-mono uppercase">
                                <BarChart3 className="w-4 h-4 text-amber-500" />
                                <span>Property Volume Distribution</span>
                              </h5>
                              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                                Breakdown of lost vs. found volume across categories and facility spaces.
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Toggle Buttons */}
                              <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-0.5 text-xs font-semibold">
                                <button
                                  type="button"
                                  onClick={() => setBarChartMode('categories')}
                                  className={`px-2.5 py-1 rounded-md transition-colors ${barChartMode === 'categories'
                                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                  By Category
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBarChartMode('locations')}
                                  className={`px-2.5 py-1 rounded-md transition-colors ${barChartMode === 'locations'
                                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                  By Location
                                </button>
                              </div>

                              <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono">
                                <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                                  <span>Lost</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                                  <span>Found</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Render Bar Chart */}
                          {renderGroupedBarChart(barChartMode === 'categories' ? categoryStats : locationStats)}
                        </div>

                        {/* Top Highlights Spotlight Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Card 1: #1 Loss Hotspot */}
                          <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-red-500 text-white">
                                  <Flame className="w-4 h-4" />
                                </span>
                                <div>
                                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                                    #1 LOSS HOTSPOT
                                  </div>
                                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                    Place with the most lost queries
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
                                {mostLostLoc.percentOfLost}% OF LOSSES
                              </span>
                            </div>

                            <div>
                              <div className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                                <span>{mostLostLoc.label}</span>
                              </div>
                              <div className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">
                                {mostLostLoc.lostCount} lost items logged · Zone: {mostLostLoc.zone || 'main'}
                              </div>
                            </div>

                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-subtle)]">
                              {digest.hotspotDeepDive?.whyProneToLoss ||
                                `${mostLostLoc.label} accounts for high activity. Please check around your seating area before leaving.`}
                            </p>

                            {/* Staff Only Mitigation Instructions */}
                            {isPrivileged && digest.hotspotDeepDive?.mitigationActions && (
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                                <div className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>Internal Staff Action</span>
                                </div>
                                <p className="leading-relaxed text-[11px]">
                                  {digest.hotspotDeepDive.mitigationActions}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Card 2: #1 Most Lost Item */}
                          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-amber-500 text-black">
                                  <Package className="w-4 h-4" />
                                </span>
                                <div>
                                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    #1 MOST LOST ITEM
                                  </div>
                                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                    Highest frequency misplaced category
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                {mostLostCat.percentOfLost}% OF LOSSES
                              </span>
                            </div>

                            <div>
                              <div className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                                <Package className="w-4 h-4 text-amber-500 shrink-0" />
                                <span>{mostLostCat.label}</span>
                              </div>
                              <div className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">
                                {mostLostCat.lostCount} lost reports · {mostLostCat.sensitive ? 'Sensitive Property' : 'Standard Belongings'}
                              </div>
                            </div>

                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-subtle)]">
                              {digest.itemDeepDive?.vulnerabilityReason ||
                                `${mostLostCat.label} is commonly misplaced during quick study or coffee breaks.`}
                            </p>

                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                              <div className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Safeguarding Advice</span>
                              </div>
                              <p className="leading-relaxed text-[11px]">
                                {digest.itemDeepDive?.preventionAdvice ||
                                  'Add a distinctive keychain, sticker, or emergency contact lockscreen wallpaper.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: ASSET PROTECTION & SAFETY PLAYBOOK (STAFF ONLY) */}
                    {isPrivileged && digestSubTab === 'playbook' && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 font-mono uppercase">
                              <Shield className="w-4 h-4 text-emerald-500" />
                              <span>Internal Safety &amp; Asset Protection Protocols</span>
                            </h5>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                              CONFIDENTIAL · STAFF ACCESS
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {(digest.safetyAndSecurityPlaybook || []).map((item, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2.5 shadow-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                                    {item.category || 'Physical Security'}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${item.impact === 'High'
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                      }`}
                                  >
                                    {item.impact || 'High'} Impact
                                  </span>
                                </div>

                                <div className="font-bold text-xs text-[var(--text-primary)]">
                                  {item.title}
                                </div>

                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                  {item.action}
                                </p>

                                {item.benefit && (
                                  <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>{item.benefit}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Conversion Pipeline */}
                        <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                          <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 font-mono uppercase">
                            <Layers className="w-4 h-4 text-emerald-500" />
                            <span>Custody Lifecycle Conversion Pipeline</span>
                          </h5>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">1. Lost Queries</div>
                              <div className="text-lg font-bold text-[var(--text-primary)] mt-1">{metrics.totalLost || 0}</div>
                              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Inquiries filed</div>
                            </div>

                            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">2. Found Intake</div>
                              <div className="text-lg font-bold text-[var(--text-primary)] mt-1">{metrics.totalFound || 0}</div>
                              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Secured at desk</div>
                            </div>

                            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">3. Claims Submitted</div>
                              <div className="text-lg font-bold text-amber-500 mt-1">{metrics.totalClaims || 0}</div>
                              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{metrics.approvedClaims || 0} approved</div>
                            </div>

                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">4. Reunited</div>
                              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{metrics.handedOverCount || 0}</div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{metrics.resolutionRate} velocity</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: SAFE CAMPUS TIPS (MEMBERS ONLY) */}
                    {!isPrivileged && digestSubTab === 'tips' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                              <span className="p-1 rounded bg-amber-500/10 text-amber-500">📱</span>
                              <span>Emergency Lockscreen Wallpaper</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              Add an alternative email or friend's contact number on your smartphone lockscreen so finders can reach you immediately without unlocking.
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                              <span className="p-1 rounded bg-emerald-500/10 text-emerald-500">🏷️</span>
                              <span>Unique Identifiers &amp; Stickers</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              Common laptops, water bottles, and earbud cases look identical. A distinctive sticker or keychain expedites verification instantly.
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                              <span className="p-1 rounded bg-blue-500/10 text-blue-500">📍</span>
                              <span>Designated Drop-Off Desk</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              Found property is safely stored at: <strong>{org.handoverInstructions || 'the campus security desk'}</strong>. Turn in found items quickly to help fellow members.
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                              <span className="p-1 rounded bg-purple-500/10 text-purple-500">🎒</span>
                              <span>The "Look Back" Habit</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              Before leaving the cafeteria, library cubicles, or meeting rooms, take 3 seconds to look under the chair and table for chargers and cards.
                            </p>
                          </div>
                        </div>

                        {/* Community Broadcast Advice */}
                        {digest.communityBroadcastTips?.length > 0 && (
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                            <div className="flex items-center gap-2">
                              <Radio className="w-4 h-4 text-emerald-500" />
                              <div className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase">
                                Community Advice from Workspace Staff
                              </div>
                            </div>
                            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                              {digest.communityBroadcastTips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-emerald-500 font-bold shrink-0">📢</span>
                                  <span className="leading-relaxed">{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="py-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
                <AlertCircle className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <p>Unable to synthesize operational intelligence report.</p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
              <span>ZERO_LEAK_CONFIDENTIALITY_ENFORCED</span>
              <button
                type="button"
                onClick={() => setShowDigestModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-bold transition-colors"
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

