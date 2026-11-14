import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  KeyRound,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  GraduationCap,
  FileText,
  Clock,
  X,
  ShieldAlert,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function UsersSection() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: "", type: "" });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        page: String(page),
        limit: "12",
      });

      const res = await fetch(`${API_URL}/api/admin/users?${query.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.warn("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleViewDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedUserDetail(data.data);
      }
    } catch (err) {
      alert("Failed to load user details: " + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleBlock = async (user) => {
    const action = user.is_blocked ? "unblock" : "block";
    if (!window.confirm(`Are you sure you want to ${action} ${user.name || user.email}?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isBlocked: !user.is_blocked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user block status.");

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_blocked: !user.is_blocked } : u))
      );
      setActionMessage({
        text: `User ${user.email} successfully ${!user.is_blocked ? "blocked" : "unblocked"}.`,
        type: "success",
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    setResettingPassword(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${resetPasswordUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password reset failed.");

      setActionMessage({ text: data.message, type: "success" });
      setResetPasswordUser(null);
      setNewPassword("");
    } catch (err) {
      alert(err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteUserSubmit = async () => {
    if (!deleteConfirmUser) return;
    setDeletingUser(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${deleteConfirmUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user.");

      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      setDeleteConfirmUser(null);
      setActionMessage({ text: data.message, type: "success" });
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            User Management ({total})
          </h2>
          <p className="text-xs text-slate-500">
            View student accounts, manage passwords, monitor activity, or block access.
          </p>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage.text && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage({ text: "", type: "" })}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by student name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>
        </div>
      </div>

      {/* USERS DATA TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-center">Exams</th>
                <th className="px-5 py-3.5 text-center">Docs</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                    Loading registered students...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{u.name || "Student"}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                      {u.examsCount || 0}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                      {u.documentsCount || 0}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          u.is_blocked
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {u.is_blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(u.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
                          title="View user details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleBlock(u)}
                          className={`rounded-lg p-1.5 transition ${
                            u.is_blocked
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-amber-500 hover:bg-amber-50"
                          }`}
                          title={u.is_blocked ? "Unblock User" : "Block User"}
                        >
                          {u.is_blocked ? <CheckCircle size={15} /> : <Ban size={15} />}
                        </button>
                        <button
                          onClick={() => setResetPasswordUser(u)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                          title="Reset Password"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete Account"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Showing page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedUserDetail.user.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedUserDetail.user.email}</p>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Exam History */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <GraduationCap size={15} /> Exams Generated ({selectedUserDetail.exams.length})
                </h4>
                {selectedUserDetail.exams.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No exams generated yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedUserDetail.exams.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                        <span className="font-semibold text-slate-800">{ex.title}</span>
                        <span className="text-slate-400">
                          {new Date(ex.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <FileText size={15} /> Uploaded Documents ({selectedUserDetail.documents.length})
                </h4>
                {selectedUserDetail.documents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedUserDetail.documents.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                        <span className="font-semibold text-slate-800">{d.filename}</span>
                        <span className="text-slate-400">
                          {(d.file_size / (1024 * 1024)).toFixed(1)} MB · {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-indigo-600 mb-2">
              <KeyRound size={22} />
              <h3 className="text-base font-bold text-slate-900">Reset Student Password</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter a new secure password for <b>{resetPasswordUser.email}</b>. Passwords are securely hashed with bcrypt.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  New Password (Min 8 chars)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {resettingPassword ? "Saving..." : "Set New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-600 mb-3">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-slate-900">Permanently Delete Account?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the student account for:
            </p>
            <div className="my-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs">
              <p className="font-bold text-rose-950">{deleteConfirmUser.name}</p>
              <p className="text-rose-700">{deleteConfirmUser.email}</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              ⚠️ This will cascade and permanently delete all their exams, documents, vector chunks, chat discussions, and storage files. This action cannot be undone.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleDeleteUserSubmit}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
              >
                {deletingUser ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{deletingUser ? "Deleting..." : "Confirm & Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
