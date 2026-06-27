'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, LayoutDashboard, LogOut, Heart, User as UserIcon, Sun, Moon, Search, X, Flame } from 'lucide-react';

const FacebookIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Determine initial theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLight = document.documentElement.classList.contains('light');
      setTheme(isLight ? 'light' : 'dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  // Fetch current user session on mount or path change
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Error fetching user status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    setIsMenuOpen(false); // Close menu when route changes
  }, [pathname]);

  // Calculate login streak count using local machine date YYYY-MM-DD
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const lastCheckIn = localStorage.getItem('last-check-in-date');
      let streak = parseInt(localStorage.getItem('streak-count') || '0', 10);

      if (lastCheckIn) {
        if (lastCheckIn === todayStr) {
          // Already checked in today, keep current streak
        } else if (lastCheckIn === yesterdayStr) {
          streak += 1;
          localStorage.setItem('streak-count', streak.toString());
          localStorage.setItem('last-check-in-date', todayStr);
        } else {
          streak = 1;
          localStorage.setItem('streak-count', '1');
          localStorage.setItem('last-check-in-date', todayStr);
        }
      } else {
        streak = 1;
        localStorage.setItem('streak-count', '1');
        localStorage.setItem('last-check-in-date', todayStr);
      }
      setStreakCount(streak);
    }
  }, [user]);

  // Close profile dropdown when clicking outside using DOM ref comparison
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        // Clear local storage and hard redirect to clear router cache
        localStorage.clear();
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-700/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-2.5 sm:px-6 lg:px-8">
        {/* Logo with Hamburger menu icon on the left (mobile-only) */}
        <div className="flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="mr-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-900/40 hover:text-slate-50 transition-colors md:hidden focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 p-2 text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-50 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Tuyen<span className="text-violet-500">LV</span>
            </span>
          </Link>
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {/* Search bar inside Navbar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <div className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ${
              isSearchOpen ? 'w-32 sm:w-48 px-2.5 py-1 border border-slate-700 bg-slate-950 rounded-full' : 'w-0 border-none'
            }`}>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Tìm truyện..."
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none border-none focus:ring-0 focus:ring-offset-0 p-0"
                onBlur={() => {
                  // Collapse search if it loses focus and has no content (delay to allow click of other buttons)
                  setTimeout(() => {
                    if (!searchVal.trim()) {
                      setIsSearchOpen(false);
                    }
                  }, 200);
                }}
                ref={(el) => {
                  if (el && isSearchOpen) {
                    el.focus();
                  }
                }}
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => setSearchVal('')}
                  className="text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (!isSearchOpen) {
                  setIsSearchOpen(true);
                } else {
                  if (searchVal.trim()) {
                    router.push(`/?search=${encodeURIComponent(searchVal.trim())}`);
                  } else {
                    setIsSearchOpen(false);
                  }
                }
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-50 hover:bg-slate-900/40 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
              title="Tìm kiếm truyện"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          <Link
            href="/"
            className={`hidden md:inline-block text-sm font-medium transition-colors hover:text-slate-50 ${
              pathname === '/' ? 'text-slate-50 font-bold' : 'text-slate-400'
            }`}
          >
            Trang Chủ
          </Link>

          <a
            href="https://www.facebook.com/profile.php?id=61590860344370"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors items-center gap-1.5"
            title="Ghé thăm Fanpage Facebook"
          >
            <FacebookIcon className="h-4 w-4 text-sky-500 fill-current" />
            <span className="hidden sm:inline">Fanpage</span>
          </a>

          {/* Light/Dark Toggle Button */}
          <button
            onClick={toggleTheme}
            className="rounded-full border border-slate-700/80 p-1.5 text-slate-400 hover:text-slate-50 hover:bg-slate-900/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-500 fill-amber-500/25" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500 fill-indigo-500/25" />
            )}
          </button>

          {!loading && (
            <>
              {/* Logged In User Options */}
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Favorites Link (desktop only) */}
                  <Link
                    href="/favorites"
                    className={`hidden md:flex items-center gap-1 text-sm font-medium transition-colors hover:text-red-400 ${
                      pathname === '/favorites' ? 'text-red-400' : 'text-slate-450'
                    }`}
                  >
                    <Heart className="h-4 w-4 fill-current text-red-500" />
                    <span>Yêu Thích</span>
                  </Link>

                  {/* Admin Control (desktop only, shown if user role is ADMIN) */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="hidden md:flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-all duration-200 bg-gradient-to-r from-violet-600 to-fuchsia-600 border border-violet-500/20 hover:scale-105"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      <span>Admin Control</span>
                    </Link>
                  )}

                  {/* User Profile display with Hover (Desktop) & Click (Mobile) Dropdown */}
                  <div 
                    ref={profileRef}
                    className="relative py-2"
                    onMouseEnter={() => {
                      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                        setIsProfileOpen(true);
                      }
                    }}
                    onMouseLeave={() => {
                      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                        setIsProfileOpen(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(!isProfileOpen);
                      }}
                      className={`flex flex-col items-start leading-none justify-center focus:outline-none transition-colors cursor-pointer ${
                        pathname === '/profile' ? 'text-violet-400' : 'text-slate-300 hover:text-violet-400'
                      }`}
                    >
                      <span className="text-xs font-semibold flex items-center gap-1.5 py-1">
                        <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="max-w-[65px] sm:max-w-[120px] truncate">{user.username}</span>
                      </span>
                    </button>

                    {/* Dropdown Menu (reveals on mouse hover or tap/click toggle) */}
                    <div className={`absolute right-0 mt-1 w-40 origin-top-right rounded-lg border border-slate-800 bg-slate-950 p-1.5 shadow-2xl z-50 duration-150 transition-all ${
                      isProfileOpen ? 'block' : 'hidden'
                    }`}>
                      <Link
                        href="/profile"
                        className="block w-full text-left px-3 py-2 rounded text-xs font-medium text-slate-300 hover:bg-slate-900/60 hover:text-white transition-colors"
                      >
                        Đổi mật khẩu
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 rounded text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>

                  {/* Streak Flame (right side of profile, both mobile and desktop) */}
                  {streakCount >= 3 && (
                    <div 
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        streakCount >= 50 
                          ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400' 
                          : 'bg-red-500/10 border border-red-500/30 text-red-400'
                      } animate-pulse`}
                      title={`Chuỗi đăng nhập: ${streakCount} ngày liên tiếp`}
                    >
                      <Flame className={`h-3.5 w-3.5 fill-current ${streakCount >= 50 ? 'text-purple-500' : 'text-red-500'}`} />
                      <span>{streakCount}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Guest Options */
                <div className="flex items-center gap-2 border-l border-slate-700/80 pl-3">
                  {/* Guest Desktop Buttons */}
                  <Link
                    href="/login"
                    className="hidden md:inline-block text-xs font-semibold text-slate-300 hover:text-slate-50 px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="hidden md:inline-block text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 px-3.5 py-1.5 rounded-full shadow-lg shadow-violet-500/10 active:scale-95 transition-all"
                  >
                    Đăng ký
                  </Link>

                  {/* Guest Mobile Button (clean icon) */}
                  <Link
                    href="/login"
                    className="md:hidden rounded-full border border-slate-700/80 p-1.5 text-slate-400 hover:text-slate-50 hover:bg-slate-900/40 transition-all cursor-pointer flex items-center justify-center"
                    title="Đăng nhập"
                  >
                    <UserIcon className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-4 py-4 space-y-3 animate-in slide-in-from-top-5 duration-200">
          <Link
            href="/"
            className={`block px-3 py-2.5 rounded-lg text-base font-semibold transition-colors ${
              pathname === '/' ? 'bg-violet-600/10 text-violet-400 border-l-2 border-violet-500' : 'text-slate-300 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            Trang Chủ
          </Link>

          {user ? (
            <>
              <Link
                href="/favorites"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                  pathname === '/favorites' ? 'bg-violet-600/10 text-violet-400 border-l-2 border-violet-500' : 'text-slate-300 hover:bg-slate-900/50 hover:text-white'
                }`}
              >
                <Heart className="h-5 w-5 text-red-500 fill-current" />
                Yêu Thích
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Admin Control
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block px-3 py-2.5 rounded-lg text-base font-semibold text-slate-300 hover:bg-slate-900/50 hover:text-white transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2.5 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 text-center rounded-lg shadow-md"
              >
                Đăng ký
              </Link>
            </>
          )}

          <a
            href="https://www.facebook.com/profile.php?id=61590860344370"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-semibold text-slate-300 hover:bg-slate-900/50 hover:text-white transition-colors"
          >
            <FacebookIcon className="h-5 w-5 text-sky-500 fill-current" />
            Fanpage Facebook
          </a>
        </div>
      )}
    </header>
  );
}
