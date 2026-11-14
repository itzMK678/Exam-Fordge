import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DocumentsSection() {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        page: String(page),
        limit: "12",
      });

      const res = await fetch(`${API_URL}/api/admin/documents?${query.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.warn("Fetch documents error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Permanently delete "${filename}" and its RAG vector chunks?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete document.");

      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            Document Management ({total})
          </h2>
          <p className="text-xs text-slate-500">
            Monitor uploaded PDFs and DOCX files, storage utilization, and RAG chunk status.
          </p>
        </div>
      </div>

      {/* STORAGE STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Storage Used
            </span>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {(stats.totalBytes / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              PDF Documents
            </span>
            <p className="mt-1 text-2xl font-black text-blue-600">
              {stats.pdfCount || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              DOCX Documents
            </span>
            <p className="mt-1 text-2xl font-black text-indigo-600">
              {stats.docxCount || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Failed Processing
            </span>
            <p className="mt-1 text-2xl font-black text-rose-600">
              {stats.failedCount || 0}
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search document filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
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
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready Only</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>
      </div>

      {/* DOCUMENTS DATA TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Document</th>
                <th className="px-5 py-3.5">Format</th>
                <th className="px-5 py-3.5">Size</th>
                <th className="px-5 py-3.5">Words</th>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-amber-600" />
                    Loading study documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No documents uploaded.
                  </td>
                </tr>
              ) : (
                documents.map((d) => (
                  <tr key={d.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {d.filename}
                    </td>
                    <td className="px-5 py-3.5 uppercase font-bold text-[10px] text-slate-500">
                      {d.file_type || "pdf"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {formatSize(d.file_size)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {d.word_count?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{d.creatorName}</p>
                      <p className="text-[11px] text-slate-400">{d.creatorEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          d.status === "ready"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : d.status === "processing"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {d.status === "ready" ? "Ready" : d.status === "processing" ? "Processing" : "Failed"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(d.id, d.filename)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 size={15} />
                      </button>
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
            Page {page} of {totalPages}
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
    </div>
  );
}
