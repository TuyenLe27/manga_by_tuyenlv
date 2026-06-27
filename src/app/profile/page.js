'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Shield, Calendar, Key, AlertCircle, RefreshCw, ArrowLeft, Lock } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    error: '',
    success: '',
    loading: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/me?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          } else {
            // No user in session
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordForm(prev => ({ ...prev, error: 'Vui lòng điền đầy đủ thông tin.', success: '' }));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordForm(prev => ({ ...prev, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.', success: '' }));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordForm(prev => ({ ...prev, error: 'Xác nhận mật khẩu mới không khớp.', success: '' }));
      return;
    }

    setPasswordForm(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi đổi mật khẩu.');
      }

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        error: '',
        success: 'Đổi mật khẩu thành công!',
        loading: false
      });
    } catch (err) {
      setPasswordForm(prev => ({ ...prev, error: err.message, loading: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-violet-500"></div>
        <p className="text-sm text-slate-400">Đang tải hồ sơ cá nhân...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 border border-slate-700/80 bg-slate-950 backdrop-blur-md rounded-2xl shadow-xl">
        <User className="mx-auto h-12 w-12 text-slate-450 mb-3" />
        <h2 className="text-lg font-bold text-slate-50 mb-2">Đăng Nhập Để Xem Hồ Sơ</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Bạn cần đăng nhập để xem thông tin tài khoản và thực hiện đổi mật khẩu cá nhân.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-95 transition-all text-center"
        >
          Đăng Nhập Ngay
        </Link>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn space-y-8">
      {/* Title & Back button */}
      <div className="flex items-center gap-3 border-b border-slate-900 pb-5">
        <Link
          href="/"
          className="rounded-full border border-slate-700/80 bg-slate-950 p-2 text-slate-400 hover:text-slate-50 hover:border-slate-700 transition-all active:scale-95 cursor-pointer"
          title="Quay lại trang chủ"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Hồ Sơ Cá Nhân
          </h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý tài khoản và thiết lập mật khẩu của bạn.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left column: User Card */}
        <div className="md:col-span-2 rounded-2xl border border-slate-700/80 bg-slate-950 p-6 backdrop-blur-sm flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none"></div>
          
          <div className="space-y-6 w-full flex flex-col items-center z-10">
            {/* Avatar block */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 p-1 shadow-xl shadow-violet-500/10 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <User className="h-10 w-10 text-violet-400" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 rounded-full bg-slate-900 border border-slate-700/80 p-1.5 text-slate-350 shadow-md">
                {isAdmin ? <Shield className="h-4 w-4 text-fuchsia-450" /> : <User className="h-4 w-4 text-slate-400" />}
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-100">{user.username}</h2>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                isAdmin
                  ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isAdmin ? 'Quản trị viên' : 'Thành viên'}
              </span>
            </div>

            <div className="w-full border-t border-slate-700/80 pt-4 flex flex-col gap-3 text-left text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>Ngày tham gia: </span>
                <span className="font-semibold text-slate-355 ml-auto">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Chưa rõ'}
                </span>
              </div>
            </div>
          </div>
          
          {isAdmin && (
            <div className="w-full pt-6 z-10">
              <Link 
                href="/admin" 
                className="inline-flex w-full justify-center rounded-lg border border-slate-700/80 bg-slate-950 py-2 text-xs font-semibold text-slate-50 hover:bg-slate-900 hover:text-violet-500 transition-colors"
              >
                Vào Admin Control
              </Link>
            </div>
          )}
        </div>

        {/* Right column: Change Password Form */}
        <div className="md:col-span-3 rounded-2xl border border-slate-700/80 bg-slate-950 p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-700/80 pb-4">
            <Lock className="h-5 w-5 text-violet-500" />
            <h3 className="text-lg font-bold text-slate-50">Đổi Mật Khẩu</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordForm.error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordForm.error}</span>
              </div>
            )}

            {passwordForm.success && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-emerald-450" />
                <span>{passwordForm.success}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mật khẩu hiện tại</label>
              <input
                type="password"
                required
                placeholder="Nhập mật khẩu hiện tại..."
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:outline-none transition-all"
                disabled={passwordForm.loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mật khẩu mới</label>
              <input
                type="password"
                required
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)..."
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:outline-none transition-all"
                disabled={passwordForm.loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                placeholder="Nhập lại mật khẩu mới..."
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:outline-none transition-all"
                disabled={passwordForm.loading}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                disabled={passwordForm.loading}
              >
                {passwordForm.loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-3.5 w-3.5" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
