import { useState, useRef } from "react";
import {
  UploadCloud,
  FileAudio,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { uploadLectureDirect } from "../services/storageUpload";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ALLOWED_EXTENSIONS = ["mp3", "wav", "m4a", "mp4", "webm", "mov", "aac"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export default function LectureUploadCard({ onLectureCreated }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateAndSelect(selected);
  };

  const validateAndSelect = (selected) => {
    setError("");
    if (!selected) return;

    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(
        `Unsupported file type .${ext}. Please upload MP3, WAV, M4A, or MP4 recordings.`
      );
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("File exceeds 500 MB limit.");
      return;
    }

    setFile(selected);
    if (!title.trim()) {
      setTitle(selected.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a recording to upload.");
      return;
    }

    setError("");
    setIsUploading(true);
    setUploadProgress(0);
    setStatusText("Uploading directly to secure storage...");

    try {
      // 1. Direct-to-Supabase Storage upload (bypasses Vercel 4.5 MB request limit)
      const uploadMetadata = await uploadLectureDirect(file, (percent) => {
        setUploadProgress(percent);
        if (percent >= 100) {
          setStatusText("Upload complete. Initializing lecture intelligence...");
        } else {
          setStatusText(`Uploading recording: ${percent}%`);
        }
      });

      setIsUploading(false);
      setIsProcessing(true);
      setStatusText("Analyzing speech and extracting lecture concepts...");

      // 2. Notify backend of uploaded file path to start background processing
      const res = await fetch(`${API_URL}/api/lectures/process-storage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          path: uploadMetadata.path,
          filename: uploadMetadata.filename,
          fileSize: uploadMetadata.fileSize,
          fileType: uploadMetadata.fileType,
          mimeType: uploadMetadata.mimeType,
          title: title.trim() || uploadMetadata.filename,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to start processing.");
      }

      setStatusText("Lecture registered! Background analysis running.");
      setFile(null);
      setTitle("");
      setUploadProgress(0);
      setIsProcessing(false);

      if (onLectureCreated) {
        onLectureCreated(data.lecture);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload or process recording.");
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const isVideo = file?.name?.toLowerCase().endsWith(".mp4") || file?.type?.startsWith("video");

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Sparkles size={14} /> Lecture Intelligence
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Upload Classroom Recording
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Upload audio or video lectures (MP3, WAV, M4A, MP4) directly from your phone or computer.
          </p>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !isUploading && !isProcessing && fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
          file
            ? "border-blue-500 bg-blue-50/30"
            : "border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/10"
        } ${isUploading || isProcessing ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.mp4,.webm,.mov,.aac,audio/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition group-hover:scale-110">
          {isVideo ? <FileVideo size={28} /> : file ? <FileAudio size={28} /> : <UploadCloud size={28} />}
        </div>

        {file ? (
          <div>
            <p className="font-bold text-slate-900">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to process
            </p>
            <p className="mt-2 text-xs font-semibold text-blue-600 hover:underline">
              Click or drag to choose a different recording
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold text-slate-800 sm:text-base">
              Choose or drag & drop lecture audio / video
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Supports MP3, WAV, M4A, and MP4 up to 500 MB (Bypasses Vercel upload limits)
            </p>
          </div>
        )}
      </div>

      {/* File details & Lecture Title */}
      {file && !isUploading && !isProcessing && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Lecture Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 - Thermodynamics & Heat Engines"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span>Direct Storage Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-blue-700">{statusText}</p>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <Loader2 className="animate-spin text-amber-600" size={20} />
          <div>
            <p className="text-xs font-bold text-amber-900">{statusText}</p>
            <p className="text-[11px] text-amber-700">
              Transcribing audio, identifying topics, definitions, and questions.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          {(error.includes("public.lectures") || error.includes("schema cache") || error.includes("Database setup")) && (
            <div className="mt-3 rounded-lg border border-rose-200/60 bg-white/80 p-3 text-slate-700 font-normal">
              <p className="font-bold text-rose-800">Quick Fix: Run Database Migration in Supabase</p>
              <p className="mt-1 text-[11px]">
                Open your Supabase SQL Editor and run the SQL script to create the <code>public.lectures</code> table and storage bucket.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          ✨ Powered by multimodal Gemini audio intelligence
        </span>
        <button
          type="button"
          disabled={!file || isUploading || isProcessing}
          onClick={handleUpload}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Uploading ({uploadProgress}%)...</span>
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Process Recording</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
