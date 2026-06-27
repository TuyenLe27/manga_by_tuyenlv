'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, User, Loader2, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại.');
      }

      // Hard navigation to "/" to bypass router cache and reload session
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      <div className="w-full max-w-md space-y-8 bg-slate-950 border border-slate-700/80 p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-50 tracking-tight">
            Đăng Nhập Thành Viên
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Đăng nhập để xem tủ truyện yêu thích của bạn.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 text-center">
            ⚠️ {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Tên đăng nhập</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                disabled={isSubmitting}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập của bạn..."
                className="w-full rounded-lg border border-slate-700/80 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Mật khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full rounded-lg border border-slate-700/80 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <span>Đăng Nhập</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500 space-y-2">
          <div>
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium underline transition-colors">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
