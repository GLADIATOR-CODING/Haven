import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  ChevronDown,
  Plus,
  KeyRound,
  Sun,
  Moon,
  Check,
  Building2,
  Search,
  Camera,
  Bell,
  CheckCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

export default function Navbar() {
  const { user, memberships, currentOrgSlug, selectOrgSlug, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const reportDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Extract route slug if on an /o/:slug route
  const routeMatch = location.pathname.match(/^\/o\/([^/]+)/);
  const routeOrgSlug = routeMatch ? routeMatch[1] : null;

  // Active workspace slug prioritizes current route
  const activeSlug = routeOrgSlug || currentOrgSlug || memberships[0]?.orgSlug;

  // Keep AuthContext in sync with current URL route
  useEffect(() => {
    if (routeOrgSlug && routeOrgSlug !== currentOrgSlug) {
      selectOrgSlug(routeOrgSlug);
    }
  }, [routeOrgSlug, currentOrgSlug, selectOrgSlug]);

  // Fetch or retrieve organization config from cache for activeSlug
  const { data: routeOrgData } = useQuery({
    queryKey: ['orgConfig', activeSlug],
    queryFn: () => api.get(`/api/o/${activeSlug}`),
    enabled: !!activeSlug,
    staleTime: 1000 * 60 * 5,
  });

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications', activeSlug],
    queryFn: () => api.get(`/api/o/${activeSlug}/notifications`),
    enabled: !!user && !!activeSlug,
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unreadCount || 0;
  const notifications = notifData?.notifications || [];

  const handleMarkAllRead = async () => {
    try {
      await api.post(`/api/o/${activeSlug}/notifications/mark-all-read`);
      refetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await api.patch(`/api/o/${activeSlug}/notifications/${notif._id}/read`);
        refetchNotifs();
      }
      setNotifDropdownOpen(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeMembership =
    memberships.find((m) => m.orgSlug === activeSlug) ||
    memberships.find((m) => m.orgSlug === currentOrgSlug) ||
    memberships[0];

  const currentWorkspaceRole = routeOrgData?.currentRole || activeMembership?.role;

  const displayedOrgName =
    routeOrgData?.org?.name ||
    activeMembership?.orgName ||
    (activeSlug === 'demo-office'
      ? 'Demo Tech Park HQ'
      : activeSlug === 'demo-campus'
      ? 'Demo Campus University'
      : activeSlug);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOrgDropdownOpen(false);
      }
      if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target)) {
        setReportDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchOrg = (slug) => {
    selectOrgSlug(slug);
    setOrgDropdownOpen(false);
    navigate(`/o/${slug}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const currentPath = location.pathname;

  return (
    <header className="sticky top-2 sm:top-5 z-50 px-3 sm:px-6 lg:px-8 pointer-events-none">
      <div className="max-w-[90rem] mx-auto pointer-events-auto rounded-full bg-black/90 dark:bg-black/95 text-white border border-neutral-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl px-3.5 sm:px-6 lg:px-7 h-12 sm:h-16 flex items-center justify-between gap-3 sm:gap-5 lg:gap-8 transition-all">
        {/* Left: Brand & Workspace Selector */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-700/80 shadow-inner flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4 fill-white text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Haven
            </span>
          </Link>

          {/* Workspace Selector Pill */}
          {user && (activeMembership || activeSlug) && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOrgDropdownOpen((p) => !p)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                <span className="truncate max-w-[90px] sm:max-w-[130px] font-semibold text-white">
                  {displayedOrgName}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400 flex-shrink-0" />
              </button>

              {orgDropdownOpen && (
                <div className="absolute left-0 mt-2.5 w-64 bg-[#111111] border border-[#262626] rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-md">
                  <div className="px-3.5 py-1.5 border-b border-[#222222] flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400">
                    <span>Workspaces</span>
                    <span>{memberships.length}</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                    {memberships.map((m) => {
                      const isCurrent = m.orgSlug === activeSlug;
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleSwitchOrg(m.orgSlug)}
                          className={`w-full px-3 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition-colors ${
                            isCurrent
                              ? 'bg-[#222222] text-white font-semibold'
                              : 'hover:bg-[#1a1a1a] text-neutral-300'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate">{m.orgName}</div>
                            <div className="text-[10px] text-neutral-400">
                              /{m.orgSlug} · {m.role}
                            </div>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-[#222222] mt-1.5 pt-1.5 px-1.5 space-y-0.5">
                    <Link
                      to="/orgs/new"
                      onClick={() => setOrgDropdownOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-white hover:bg-[#1a1a1a] flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-red-500" />
                      <span>Create Workspace</span>
                    </Link>
                    <Link
                      to="/join"
                      onClick={() => setOrgDropdownOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:bg-[#1a1a1a] flex items-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Join Workspace</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Clean Uncluttered Tabs */}
        <nav className="hidden md:flex min-w-0 items-center justify-center gap-4 lg:gap-5 text-[13px] font-medium whitespace-nowrap">
          {activeSlug ? (
            <>
              <Link
                to={`/o/${activeSlug}`}
                className={`transition-colors flex items-center gap-1.5 ${
                  currentPath === `/o/${activeSlug}`
                    ? 'text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {currentPath === `/o/${activeSlug}` && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                <span>Directory</span>
              </Link>
              <Link
                to={`/o/${activeSlug}/feed`}
                className={`transition-colors flex items-center gap-1.5 ${
                  currentPath.includes('/feed')
                    ? 'text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {currentPath.includes('/feed') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                <span>Feed</span>
              </Link>
              <Link
                to={`/o/${activeSlug}/activity`}
                className={`transition-colors flex items-center gap-1.5 ${
                  currentPath.includes('/activity')
                    ? 'text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {currentPath.includes('/activity') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                <span>Activity</span>
              </Link>
              {['admin', 'moderator'].includes(currentWorkspaceRole) && (
                <>
                  <Link
                    to={`/o/${activeSlug}/moderation`}
                    className={`transition-colors flex items-center gap-1.5 ${
                      currentPath.includes('/moderation') && !currentPath.endsWith('/handover')
                        ? 'text-white font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {currentPath.includes('/moderation') && !currentPath.endsWith('/handover') && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <span>Moderation</span>
                  </Link>
                  <Link
                    to={`/o/${activeSlug}/moderation/handover`}
                    className={`hidden xl:flex transition-colors items-center gap-1.5 ${
                      currentPath.endsWith('/moderation/handover')
                        ? 'text-white font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Open the physical handover terminal"
                  >
                    {currentPath.endsWith('/moderation/handover') && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <span>Handover</span>
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`transition-colors flex items-center gap-1.5 ${
                  currentPath === '/' ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {currentPath === '/' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                <span>Home</span>
              </Link>
              <Link
                to="/join"
                className={`transition-colors flex items-center gap-1.5 ${
                  currentPath.startsWith('/join')
                    ? 'text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {currentPath.startsWith('/join') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                <span>Join Workspace</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right: Consolidated Action & Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {activeSlug ? (
            <div className="relative" ref={reportDropdownRef}>
              <button
                onClick={() => setReportDropdownOpen((p) => !p)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow-md whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Report</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {reportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#111111] border border-[#262626] rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-md">
                  <Link
                    to={`/o/${activeSlug}/report/lost`}
                    onClick={() => setReportDropdownOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs text-white hover:bg-[#222222] flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">I Lost Something</div>
                      <div className="text-[10px] text-neutral-400">Describe-it & match</div>
                    </div>
                  </Link>

                  <Link
                    to={`/o/${activeSlug}/report/found`}
                    onClick={() => setReportDropdownOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs text-white hover:bg-[#222222] flex items-center gap-2.5 transition-colors mt-0.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">I Found Something</div>
                      <div className="text-[10px] text-neutral-400">Camera-first intake</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/orgs/new"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow-md whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Workspace</span>
            </Link>
          )}

          {/* Notification Hub */}
          {user && activeSlug && (
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setNotifDropdownOpen((p) => !p)}
                className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors relative"
                title="Notifications & Custody Alerts"
                aria-label="Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-mono font-black animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111111] border border-[#262626] rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#262626]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-red-500" />
                      <span className="font-bold text-xs text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-[#1e1e1e]/60">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-neutral-400 space-y-1.5">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mx-auto" />
                        <p className="font-medium text-white">All caught up!</p>
                        <p className="text-[10px]">No pending custody or match notifications.</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isMatch = n.type === 'match_found';
                        const isApproved = n.type === 'claim_approved';
                        const isRejected = n.type === 'claim_rejected';
                        const isHandover = n.type === 'handover_ready';

                        return (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                              n.read
                                ? 'opacity-70 hover:opacity-100 hover:bg-[#1a1a1a]'
                                : 'bg-neutral-900/90 border border-neutral-800/80 hover:border-neutral-700'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isMatch
                                  ? 'bg-red-500/15 text-red-400'
                                  : isApproved
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : isRejected
                                  ? 'bg-rose-500/15 text-rose-400'
                                  : isHandover
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-blue-500/15 text-blue-400'
                              }`}
                            >
                              {isMatch && <Sparkles className="w-3.5 h-3.5" />}
                              {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {isRejected && <XCircle className="w-3.5 h-3.5" />}
                              {isHandover && <KeyRound className="w-3.5 h-3.5" />}
                              {!isMatch && !isApproved && !isRejected && !isHandover && (
                                <Bell className="w-3.5 h-3.5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4
                                  className={`text-xs truncate ${
                                    n.read ? 'font-medium text-neutral-300' : 'font-bold text-white'
                                  }`}
                                >
                                  {n.title}
                                </h4>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed">
                                {n.message}
                              </p>
                              <div className="text-[9px] font-mono text-neutral-500 mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-neutral-200" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>

          {/* User Account / Profile */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Link
                to="/profile"
                className="flex max-w-[172px] items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-white transition-all group"
                title="Account Dashboard & Roles"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    (user.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                  <span className="hidden sm:inline min-w-0 font-medium text-neutral-200 group-hover:text-white max-w-[100px] lg:max-w-[130px] truncate">
                  {user.name || 'Account'}
                </span>
                {currentWorkspaceRole && (
                  <span
                    className={`hidden lg:inline px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      currentWorkspaceRole === 'admin'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : currentWorkspaceRole === 'moderator'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {currentWorkspaceRole}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}
