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
  LogOut,
  Sun,
  Moon,
  Check,
  Building2,
  Search,
  Camera,
} from 'lucide-react';

export default function Navbar() {
  const { user, memberships, currentOrgSlug, selectOrgSlug, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const reportDropdownRef = useRef(null);

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
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <header className="sticky top-2 sm:top-5 z-50 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto rounded-full bg-black/90 dark:bg-black/95 text-white border border-neutral-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl px-3.5 sm:px-5 h-12 sm:h-14 flex items-center justify-between gap-3 sm:gap-6 transition-all">
        {/* Left: Brand & Workspace Selector */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
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
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium">
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
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-white transition-all group"
                title="Account Dashboard & Roles"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    (user.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden sm:inline font-medium text-neutral-200 group-hover:text-white max-w-[110px] truncate">
                  {user.name || 'Account'}
                </span>
                {currentWorkspaceRole && (
                  <span
                    className={`hidden md:inline px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
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

              <button
                onClick={handleLogout}
                title="Sign out"
                className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-red-950/50 border border-neutral-800 hover:border-red-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
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
