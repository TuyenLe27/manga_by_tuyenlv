'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trash2, User, Shield, Calendar, AlertCircle, RefreshCw, 
  Search, Users, Landmark, Plus, Pencil, X
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    username: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const [addModal, setAddModal] = useState({
    isOpen: false,
    username: '',
    password: '',
    role: 'USER',
    error: '',
    loading: false
  });

  const [editModal, setEditModal] = useState({
    isOpen: false,
    id: null,
    username: '',
    password: '',
    role: 'USER',
    error: '',
    loading: false
  });

  useEffect(() => {
    fetchUsersAndMe();
  }, []);

  const fetchUsersAndMe = async () => {
    try {
      setLoading(true);
      // Fetch me
      const meRes = await fetch('/api/auth/me?t=' + Date.now());
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentAdmin(meData.user);
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users?t=' + Date.now());
      if (!usersRes.ok) throw new Error('Không thể tải danh sách thành viên');
      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = (id, username) => {
    setDeleteModal({
      isOpen: true,
      id,
      username
    });
  };

  const executeDeleteUser = async () => {
    if (!deleteModal.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteModal.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi xóa người dùng');
      }

      // Update state
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.id));
      setDeleteModal({ isOpen: false, id: null, username: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!addModal.username || !addModal.password || !addModal.role) {
      setAddModal(prev => ({ ...prev, error: 'Vui lòng điền đầy đủ thông tin.' }));
      return;
    }
    if (addModal.username.length < 3) {
      setAddModal(prev => ({ ...prev, error: 'Tên đăng nhập tối thiểu 3 ký tự.' }));
      return;
    }
    if (addModal.password.length < 6) {
      setAddModal(prev => ({ ...prev, error: 'Mật khẩu tối thiểu 6 ký tự.' }));
      return;
    }
    setAddModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: addModal.username,
          password: addModal.password,
          role: addModal.role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi tạo thành viên.');
      }
      setUsers(prev => [data, ...prev]);
      setAddModal({ isOpen: false, username: '', password: '', role: 'USER', error: '', loading: false });
    } catch (err) {
      setAddModal(prev => ({ ...prev, error: err.message, loading: false }));
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editModal.username || !editModal.role) {
      setEditModal(prev => ({ ...prev, error: 'Vui lòng điền đầy đủ tên đăng nhập và vai trò.' }));
      return;
    }
    if (editModal.username.length < 3) {
      setEditModal(prev => ({ ...prev, error: 'Tên đăng nhập tối thiểu 3 ký tự.' }));
      return;
    }
    if (editModal.password && editModal.password.length < 6) {
      setEditModal(prev => ({ ...prev, error: 'Mật khẩu mới tối thiểu 6 ký tự.' }));
      return;
    }
    setEditModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await fetch(`/api/admin/users/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editModal.username,
          role: editModal.role,
          password: editModal.password || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi cập nhật thành viên.');
      }
      setUsers(prev => prev.map(u => u.id === editModal.id ? data : u));
      setEditModal({ isOpen: false, id: null, username: '', password: '', role: 'USER', error: '', loading: false });
    } catch (err) {
      setEditModal(prev => ({ ...prev, error: err.message, loading: false }));
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsersCount = users.length;
  const adminUsersCount = users.filter((u) => u.role === 'ADMIN').length;
  const regularUsersCount = totalUsersCount - adminUsersCount;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-violet-500"></div>
        <p className="text-sm text-slate-400">Đang tải danh sách thành viên...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Description */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Bảng Điều Khiển Admin
        </h1>
        <p className="text-sm text-slate-400 mt-1">Quản lý truyện tranh, chương truyện và danh sách thành viên hệ thống.</p>
      </div>

      {/* Admin sub-navigation tabs */}
      <div className="flex border-b border-slate-700/80 gap-6">
        <Link 
          href="/admin" 
          className="pb-3 text-sm font-semibold text-slate-400 hover:text-slate-50 transition-colors"
        >
          Quản Lý Truyện
        </Link>
        <Link 
          href="/admin/users" 
          className="border-b-2 border-violet-500 pb-3 text-sm font-bold text-slate-50"
        >
          Quản Lý Người Dùng
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-violet-500/10 p-3 text-violet-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số thành viên</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-50">{totalUsersCount}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-fuchsia-500/10 p-3 text-fuchsia-500">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quản trị viên (Admin)</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-50">{adminUsersCount}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-400">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thành viên thường</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-50">{regularUsersCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* User Search & Table */}
      <div className="space-y-4">
        {/* Search & Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm thành viên theo tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={() => setAddModal({
              isOpen: true,
              username: '',
              password: '',
              role: 'USER',
              error: '',
              loading: false
            })}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm thành viên</span>
          </button>
        </div>

        {/* Table Container */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="mx-auto h-12 w-12 text-slate-750 mb-3" />
              <p className="text-sm">Không tìm thấy thành viên nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/80 bg-slate-900/30 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Tên tài khoản</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4">Ngày đăng ký</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750/60 text-sm">
                  {filteredUsers.map((u) => {
                    const isSelf = currentAdmin && currentAdmin.id === u.id;
                    const isAdminUser = u.role === 'ADMIN';

                    return (
                      <tr key={u.id} className="transition-colors hover:bg-slate-900/30">
                        <td className="px-6 py-4 font-semibold text-slate-200 flex items-center gap-2">
                          <div className="rounded-full bg-slate-900/50 p-1.5 text-slate-400">
                            <User className="h-4 w-4" />
                          </div>
                          <span>
                            {u.username}
                            {isSelf && (
                              <span className="ml-1.5 rounded-md bg-violet-550/15 border border-violet-500/25 px-1.5 py-0.5 text-[10px] font-bold text-violet-400">
                                Bạn
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            isAdminUser
                              ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20'
                              : 'bg-slate-900 text-slate-400 border border-slate-700/80'
                          }`}>
                            {isAdminUser ? 'Admin' : 'Thành viên'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 flex-row">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            {new Date(u.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditModal({
                                isOpen: true,
                                id: u.id,
                                username: u.username,
                                password: '',
                                role: u.role,
                                error: '',
                                loading: false
                              })}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/30 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={actionLoading}
                              title="Sửa thông tin"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => confirmDeleteUser(u.id, u.username)}
                              className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-500 hover:bg-red-500/20 hover:text-red-650 transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={isSelf || isAdminUser || actionLoading}
                              title={isSelf ? 'Không thể tự xóa bản thân' : isAdminUser ? 'Không thể xóa Admin khác' : 'Xóa tài khoản'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !actionLoading && setDeleteModal({ ...deleteModal, isOpen: false })}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-50">Xóa Thành Viên</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Bạn có chắc chắn muốn xóa tài khoản của <span className="font-bold text-slate-50">"{deleteModal.username}"</span>? 
                  Hành động này sẽ xóa vĩnh viễn tài khoản cùng danh sách truyện yêu thích của họ. Không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-700/80 pt-4">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, id: null, username: '' })}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-colors cursor-pointer"
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeDeleteUser}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 shadow-md shadow-red-600/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !addModal.loading && setAddModal({ ...addModal, isOpen: false })}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-700/80 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <User className="h-5 w-5 text-violet-500" />
                <span>Thêm Thành Viên Mới</span>
              </h3>
              <button 
                onClick={() => setAddModal({ ...addModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-50 p-1 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-900/50 cursor-pointer transition-colors"
                disabled={addModal.loading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              {addModal.error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{addModal.error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1.5">Tên đăng nhập</label>
                <input 
                  type="text"
                  required
                  placeholder="Nhập tên đăng nhập..."
                  value={addModal.username}
                  onChange={(e) => setAddModal({ ...addModal, username: e.target.value })}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:outline-none transition-all"
                  disabled={addModal.loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1.5">Mật khẩu</label>
                <input 
                  type="password"
                  required
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                  value={addModal.password}
                  onChange={(e) => setAddModal({ ...addModal, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:outline-none transition-all"
                  disabled={addModal.loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1.5">Vai trò</label>
                <select
                  value={addModal.role}
                  onChange={(e) => setAddModal({ ...addModal, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-violet-500 focus:outline-none transition-all cursor-pointer"
                  disabled={addModal.loading}
                >
                  <option value="USER" className="bg-slate-950 text-slate-200">Thành viên</option>
                  <option value="ADMIN" className="bg-slate-950 text-slate-200">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-700/80 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setAddModal({ ...addModal, isOpen: false })}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-colors cursor-pointer"
                  disabled={addModal.loading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  disabled={addModal.loading}
                >
                  {addModal.loading ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Thêm thành viên</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !editModal.loading && setEditModal({ ...editModal, isOpen: false })}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-700/80 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <Pencil className="h-4.5 w-4.5 text-violet-500" />
                <span>Sửa Thông Tin Thành Viên</span>
              </h3>
              <button 
                onClick={() => setEditModal({ ...editModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-50 p-1 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-900/50 cursor-pointer transition-colors"
                disabled={editModal.loading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              {editModal.error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editModal.error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1.5">Tên đăng nhập</label>
                <input 
                  type="text"
                  required
                  placeholder="Nhập tên đăng nhập..."
                  value={editModal.username}
                  onChange={(e) => setEditModal({ ...editModal, username: e.target.value })}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:outline-none transition-all"
                  disabled={editModal.loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1.5">Mật khẩu mới</label>
                <input 
                  type="password"
                  placeholder="Để trống nếu không muốn thay đổi..."
                  value={editModal.password}
                  onChange={(e) => setEditModal({ ...editModal, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-450 focus:border-violet-500 focus:outline-none transition-all"
                  disabled={editModal.loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1.5">Vai trò</label>
                <select
                  value={editModal.role}
                  onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-violet-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={editModal.loading || (currentAdmin && currentAdmin.id === editModal.id)}
                  title={currentAdmin && currentAdmin.id === editModal.id ? 'Không thể tự đổi vai trò của chính mình' : ''}
                >
                  <option value="USER" className="bg-slate-950 text-slate-200">Thành viên</option>
                  <option value="ADMIN" className="bg-slate-950 text-slate-200">Admin</option>
                </select>
                {currentAdmin && currentAdmin.id === editModal.id && (
                  <span className="text-[10px] text-slate-500 mt-1 block">Bạn không thể tự hạ cấp hoặc thay đổi vai trò của bản thân.</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-700/80 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setEditModal({ ...editModal, isOpen: false })}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-colors cursor-pointer"
                  disabled={editModal.loading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  disabled={editModal.loading}
                >
                  {editModal.loading ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
