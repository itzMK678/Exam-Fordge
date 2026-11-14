import { useState, useEffect } from "react";
import {
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  FileCode,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RAGMonitoringSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchRAG = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_URL}/api/admin/rag/stats`, {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) setData(json.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRAG();
  }, []);

  const filteredDocs = (data?.documents || []).filter((d) =>
    (d.filename || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            RAG Pipeline & Vector Indexing
          </h2>
          <p className="text-xs text-slate-500">
            Monitor document chunking, semantic context retrieval, and vector database indexing health.
          </p>
        </div>

        <button
          onClick={fetchRAG}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh Pipeline</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Indexed Documents
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {data?.totalIndexedDocuments || 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">Active in RAG retrieval</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Vector Chunks
          </span>
          <p className="mt-2 text-2xl font-black text-indigo-600">
            {data?.totalChunks?.toLocaleString() || 0}
          </p>
          <span className="text-[11px] text-slate-400">In document_chunks</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Chunk Overlap / Window
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            75 / 500
          </p>
          <span className="text-[11px] text-slate-400">Words per chunk</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Embedding Health
          </span>
          <p className="mt-2 text-sm font-black text-emerald-600">
            {data?.embeddingStatus || "Operational"}
          </p>
          <span className="text-[11px] text-slate-400">Semantic retrieval ready</span>
        </div>
      </div>

      {/* DOCUMENT INDEXING TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-slate-900">Document Chunk Indexing State</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search indexed file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Document Title</th>
                <th className="px-5 py-3">Pages</th>
                <th className="px-5 py-3">Total Words</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3">Indexed On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No indexed documents match query.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {doc.filename}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{doc.page_count || 1}</td>
                    <td className="px-5 py-3 text-slate-600">{doc.word_count?.toLocaleString() || 0}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
