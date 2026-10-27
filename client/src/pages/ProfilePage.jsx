import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Shield,
  Building2,
  Mail,
  Phone,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  LogOut,
  Sparkles,
  KeyRound,
  X,
  Check,
  Users,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, memberships, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [saveStatus, setSaveStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // Moderator request modal state
  const [selectedOrgForMod, setSelectedOrgForMod] = useState(null);
  const [modReason, setModReason] = useState('');
  const [modContact, setModContact] = useState('');
  const [modStatusMsg, setModStatusMsg] = useState(null);
  const [submittingMod, setSubmittingMod] = useState(false);

  // Query active moderator requests for user across workspaces
  const { data: userModRequests, refetch: refetchModRequests } = useQuery({
    queryKey: ['myModeratorRequests'],
    queryFn: async () => {
      const results = {};
      for (const m of memberships) {
        try {
          const res = await api.get(`/api/o/${m.orgSlug}/moderator-requests`);
          results[m.orgSlug] = res?.requests || [];
        } catch {
          results[m.orgSlug] = [];
        }
      }
      return results;
    },
    enabled: memberships.length > 0,
    staleTime: 1000 * 30,
  });

  const isAdminOfAny = memberships.some((m) => m.role === 'admin');

  const {
    data: adminModRequestsData,
    refetch: refetchAdminRequests,
    isLoading: adminRequestsLoading,
  } = useQuery({
    queryKey: ['adminModeratorRequests'],
    queryFn: () => api.get('/api/auth/admin/moderator-requests'),
    enabled: !!user && isAdminOfAny,
  });

  const [processingAdminReqId, setProcessingAdminReqId] = useState(null);
  const [adminActionFeedback, setAdminActionFeedback] = useState(null);

  const handleAdminReviewRequest = async (orgSlug, requestId, action) => {
    setProcessingAdminReqId(requestId);
    setAdminActionFeedback(null);
    try {
      await api.patch(`/api/o/${orgSlug}/moderator-requests/${requestId}`, { action });
      await refetchAdminRequests();
      queryClient.invalidateQueries({ queryKey: ['orgModRequests'] });
      queryClient.invalidateQueries({ queryKey: ['orgConfig'] });
      setAdminActionFeedback({ type: 'success', message: `Moderator request ${action === 'approve' ? 'approved' : 'declined'}.` });
    } catch (err) {
      setAdminActionFeedback({ type: 'error', message: err.message || 'Action failed' });
    } finally {
      setProcessingAdminReqId(null);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('phoneNumber', phoneNumber);
        formData.append('bio', bio);
        formData.append('avatar', avatarFile);
        await updateProfile(formData);
      } else {
        await updateProfile({
          name,
          phoneNumber,
          bio,
          avatar,
        });
      }
      setSaveStatus({ type: 'success', message: 'Profile details saved successfully.' });
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to save profile changes.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitModRequest = async (e) => {
    e.preventDefault();
    if (!selectedOrgForMod) return;
    setSubmittingMod(true);
    setModStatusMsg(null);
    try {
      await api.post(`/api/o/${selectedOrgForMod.orgSlug}/moderator-requests`, {
        reason: modReason,
        contactInfo: modContact,
      });
      setModStatusMsg({ type: 'success', message: 'Application submitted! The workspace admin will review your request.' });
      refetchModRequests();
      setTimeout(() => {
        setSelectedOrgForMod(null);
        setModReason('');
        setModContact('');
        setModStatusMsg(null);
      }, 2000);
    } catch (err) {
      setModStatusMsg({ type: 'error', message: err.message || 'Failed to submit application.' });
    } finally {
      setSubmittingMod(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">Please sign in to access your dashboard.</p>
        <Link
          to="/login"
          className="inline-block px-4 py-2 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-8 py-4 sm:py-12 space-y-6 sm:space-y-10 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HAVEN IDENTITY PROTOCOL</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Account & Workspace Dashboard
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage your personal profile, active organization roles, and custody desk staff privileges.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {adminActionFeedback && (
        <div role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-xs font-medium ${adminActionFeedback.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'}`}>
          {adminActionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Personal Profile & Photo */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-5">
            <div className="text-xs font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
              USER AVATAR
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-2 border-[var(--border-strong)] bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center overflow-hidden shadow-inner font-mono text-2xl font-bold">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    (name || 'U').charAt(0).toUpperCase()
                  )}
                </div>

                <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md cursor-pointer hover:scale-105 transition-transform">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <div className="font-bold text-sm text-[var(--text-primary)]">{name || 'Unnamed Member'}</div>
                <div className="text-xs text-[var(--text-muted)] font-mono">{user.email}</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Joined Haven:</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Workspaces:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{memberships.length}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Update Details & Workspaces */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Details Form */}
          <form
            onSubmit={handleSaveProfile}
            className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h2 className="text-xs font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
                PERSONAL CREDENTIALS
              </h2>
              {saveStatus && (
                <span
                  className={`text-xs flex items-center gap-1 ${
                    saveStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {saveStatus.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  {saveStatus.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Email Address <span className="text-[10px] text-[var(--text-muted)]">(Verified)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] opacity-70 cursor-not-allowed text-xs text-[var(--text-secondary)] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Phone / Handover Contact <span className="text-[10px] text-[var(--text-muted)]">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Avatar Image URL <span className="text-[10px] text-[var(--text-muted)]">(Or upload via photo)</span>
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => {
                    setAvatar(e.target.value);
                    if (!avatarFile) setAvatarPreview(e.target.value);
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Bio / Department Notes <span className="text-[10px] text-[var(--text-muted)]">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Student ID, office wing, or front desk affiliation..."
                className="w-full px-3 py-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Admin Governance: Incoming Staff Applications */}
          {isAdminOfAny && (
            <div className="p-5 rounded-xl border border-amber-500/30 bg-[var(--bg-card)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase flex items-center gap-2">
                      <span>ADMIN GOVERNANCE · DESK STAFF APPLICATIONS</span>
                      {adminModRequestsData?.requests?.filter((r) => r.status === 'pending').length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          {adminModRequestsData.requests.filter((r) => r.status === 'pending').length} PENDING
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Review member applications to become custody desk moderators across your workspaces.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => refetchAdminRequests()}
                  className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Refresh
                </button>
              </div>

              {adminRequestsLoading ? (
                <div className="py-6 text-center text-xs font-mono text-[var(--text-muted)]">
                  LOADING_STAFF_APPLICATIONS...
                </div>
              ) : (!adminModRequestsData?.requests || adminModRequestsData.requests.length === 0) ? (
                <div className="p-6 text-center border border-dashed border-[var(--border-subtle)] rounded-lg space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-[var(--text-primary)]">All Desk Applications Reviewed</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">No member applications currently pending for your workspaces.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminModRequestsData.requests.map((req) => {
                    const orgSlug = req.orgId?.slug || 'unknown';
                    const orgName = req.orgId?.name || orgSlug;
                    const applicant = req.userId || {};

                    return (
                      <div
                        key={req._id}
                        className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center text-xs font-bold font-mono overflow-hidden flex-shrink-0">
                              {applicant.avatar ? (
                                <img src={applicant.avatar} alt={applicant.name} className="w-full h-full object-cover" />
                              ) : (
                                (applicant.name || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[var(--text-primary)]">
                                  {applicant.name || 'Applicant'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                                  {orgName}
                                </span>
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                {applicant.email} {req.contactInfo ? `· Contact: ${req.contactInfo}` : applicant.phoneNumber ? `· Phone: ${applicant.phoneNumber}` : ''}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase self-start sm:self-auto ${
                              req.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                : req.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-500 border border-red-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                          <div className="text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                            Applicant Statement / Availability
                          </div>
                          "{req.reason}"
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border-subtle)]">
                            <button
                              type="button"
                              onClick={() => handleAdminReviewRequest(orgSlug, req._id, 'reject')}
                              disabled={processingAdminReqId === req._id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminReviewRequest(orgSlug, req._id, 'approve')}
                              disabled={processingAdminReqId === req._id}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Approve as Moderator</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Workspaces & Role Management */}
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-xs font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
                  WORKSPACE ROLES & DESK ACCESS
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Your current permissions in Haven communities. Apply to become a desk moderator to verify claims.
                </p>
              </div>

              <Link
                to="/join"
                className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-mono"
              >
                <span>+ Join Another</span>
              </Link>
            </div>

            {memberships.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[var(--border-subtle)] rounded-lg space-y-2">
                <Building2 className="w-6 h-6 text-[var(--text-muted)] mx-auto" />
                <p className="text-xs text-[var(--text-secondary)]">You have not joined any workspace yet.</p>
                <Link
                  to="/join"
                  className="inline-block px-3 py-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold"
                >
                  Join with Invite Code
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {memberships.map((m) => {
                  const requestsForOrg = userModRequests?.[m.orgSlug] || [];
                  const pendingReq = requestsForOrg.find((r) => r.status === 'pending');
                  const rejectedReq = requestsForOrg.find((r) => r.status === 'rejected');

                  return (
                    <div
                      key={m.id || m.orgSlug}
                      className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/o/${m.orgSlug}`}
                            className="font-bold text-sm text-[var(--text-primary)] hover:underline flex items-center gap-1.5"
                          >
                            <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{m.orgName || m.orgSlug}</span>
                          </Link>

                          {/* Role Badge */}
                          {m.role === 'admin' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              ADMIN (OWNER)
                            </span>
                          )}
                          {m.role === 'moderator' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              MODERATOR (DESK STAFF)
                            </span>
                          )}
                          {m.role === 'member' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
                              MEMBER
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          Slug: /o/{m.orgSlug} · Joined {new Date(m.joinedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Moderator Request Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m.role === 'member' ? (
                          pendingReq ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                              <Clock className="w-3.5 h-3.5 animate-spin" />
                              <span>Application Pending Review</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedOrgForMod(m);
                                setModReason('');
                                setModContact('');
                                setModStatusMsg(null);
                              }}
                              className="px-3 py-1.5 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Request Moderator Role</span>
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Staff Privileges Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Moderator Application Modal */}
      {selectedOrgForMod && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Apply to Become a Moderator
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">
                    Workspace: {selectedOrgForMod.orgName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrgForMod(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitModRequest} className="space-y-4">
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Custody desk moderators can review sensitive items, approve verified claims, and oversee physical item handovers. Workspace administrators review all applications before granting staff access.
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Why do you need custody desk permissions? *
                </label>
                <textarea
                  required
                  rows={3}
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  placeholder="e.g. I work at the Central Library Front Desk from 9am-4pm on weekdays and handle physical lost property intake."
                  className="w-full px-3 py-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Contact Handle or Department ID <span className="text-[10px] text-[var(--text-muted)]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={modContact}
                  onChange={(e) => setModContact(e.target.value)}
                  placeholder="e.g. Library Staff ID #4421 / ext 210"
                  className="w-full px-3 py-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>

              {modStatusMsg && (
                <div
                  className={`p-3 rounded-md text-xs font-medium ${
                    modStatusMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {modStatusMsg.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrgForMod(null)}
                  className="px-3 py-2 rounded-md text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMod}
                  className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingMod ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
