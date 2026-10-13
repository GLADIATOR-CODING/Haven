import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

export default function Navbar() {
  const { user, memberships, currentOrgSlug, selectOrgSlug, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeMembership = memberships.find((m) => m.orgSlug === currentOrgSlug) || memberships[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOrgDropdownOpen(false);
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
      <div className="max-w-4xl mx-auto pointer-events-auto rounded-full bg-black/90 dark:bg-black/95 text-white border border-neutral-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl px-3.5 sm:px-5 h-12 sm:h-14 flex items-center justify-between gap-2.5 sm:gap-4 transition-all">
        {/* Left: Brand & Workspace Selector */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-700/80 shadow-inner flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4 fill-white text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Haven
            </span>
          </Link>

          {/* Workspace Selector Pill */}
          {user && activeMembership && (
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                onClick={() => setOrgDropdownOpen((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                <span className="truncate max-w-[120px] font-semibold text-white">
                  {activeMembership.orgName}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {orgDropdownOpen && (
                <div className="absolute left-0 mt-2.5 w-64 bg-[#111111] border border-[#262626] rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-md">
                  <div className="px-3.5 py-1.5 border-b border-[#222222] flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400">
                    <span>Workspaces</span>
                    <span>{memberships.length}</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                    {memberships.map((m) => {
                      const isCurrent = m.orgSlug === currentOrgSlug;
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

        {/* Center: Clean Horizontal Navigation Links (Supaste / Rekorder style) */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium">
          <Link
            to="/"
            className={`transition-colors flex items-center gap-1.5 ${
              currentPath === '/' ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {currentPath === '/' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            <span>Home</span>
          </Link>

          {activeMembership ? (
            <>
              <Link
                to={`/o/${activeMembership.orgSlug}`}
                className={`transition-colors flex items-center gap-1.5 ${
                  currentPath === `/o/${activeMembership.orgSlug}`
                    ? 'text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {currentPath === `/o/${activeMembership.orgSlug}` && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                <span>Directory</span>
              </Link>
              <Link
                to={`/o/${activeMembership.orgSlug}/report/found`}
                className={`transition-colors flex items-center gap-1.5 ${
                  currentPath.includes('/report/found')
                    ? 'text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {currentPath.includes('/report/found') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                <span>Report Found</span>
              </Link>
            </>
          ) : (
            <Link
              to="/join"
              className={`transition-colors flex items-center gap-1.5 ${
                currentPath.startsWith('/join')
                  ? 'text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {currentPath.startsWith('/join') && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
              <span>Join Workspace</span>
            </Link>
          )}
        </nav>

        {/* Right: High-Contrast Pill CTA (Supaste style) & User Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {activeMembership ? (
            <Link
              to={`/o/${activeMembership.orgSlug}/report/found`}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow-md whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Report Found</span>
            </Link>
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

          {/* User Account / Auth */}
          {user ? (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-full bg-neutral-900 hover:bg-red-950/50 border border-neutral-800 hover:border-red-800 text-neutral-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to="/login"
              className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
