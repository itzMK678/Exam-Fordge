import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// =========================================================================
// MAIN COMPONENT
// =========================================================================
export default function UploadPage({ onExamGenerated }) {
  // -----------------------------------------------------------------------
  // EXAM STATE (Self-contained, no external context required)
  // -----------------------------------------------------------------------
  const [generatedExam, setGeneratedExam] = useState(null);
  const [activeAnswerQuestion, setActiveAnswerQuestion] = useState(null);
  const [isAnswerPanelOpen, setIsAnswerPanelOpen] = useState(false);

  const clearExam = () => {
    setGeneratedExam(null);
    setActiveAnswerQuestion(null);
    setIsAnswerPanelOpen(false);
  };

  const openAnswerPanel = (question) => {
    setActiveAnswerQuestion(question);
    setIsAnswerPanelOpen(true);
  };

  const closeAnswerPanel = () => {
    setIsAnswerPanelOpen(false);
    setActiveAnswerQuestion(null);
  };

  // -----------------------------------------------------------------------
  // FILE & FORM STATE
  // -----------------------------------------------------------------------
  const [files, setFiles] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [mcqs, setMcqs] = useState(4);
  const [shortQuestions, setShortQuestions] = useState(3);
  const [longQuestions, setLongQuestions] = useState(3);
  const [focusTopics, setFocusTopics] = useState("");
  const [difficulty, setDifficulty] = useState("Mixed");
  const [includeAnswers, setIncludeAnswers] = useState(true);

  // -----------------------------------------------------------------------
  // UPLOAD & STATUS STATE
  // -----------------------------------------------------------------------
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(() => {
    try {
      const saved = localStorage.getItem("examforge_uploaded_docs");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  useEffect(() => {
    try {
      if (uploadResult?.documents?.length > 0) {
        localStorage.setItem("examforge_uploaded_docs", JSON.stringify(uploadResult));
      } else if (uploadResult === null) {
        localStorage.removeItem("examforge_uploaded_docs");
      }
    } catch {
      // LocalStorage error boundary
    }
  }, [uploadResult]);

  const processedDocuments =
    uploadResult?.documents?.length > 0
      ? uploadResult.documents
      : generatedExam?.documents || [];

  // -----------------------------------------------------------------------
  // SUMMARY PANEL STATE
  // -----------------------------------------------------------------------
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const openSummary = (doc) => {
    setSelectedDocument(doc);
    setIsSummaryOpen(true);
  };

  const closeSummary = () => {
    setIsSummaryOpen(false);
    setSelectedDocument(null);
  };

  // -----------------------------------------------------------------------
  // QUESTION VALIDATION & AUTO-BALANCE
  // -----------------------------------------------------------------------
  const questionSum = mcqs + shortQuestions + longQuestions;
  const isDistributionValid = questionSum === totalQuestions;
  const hasDocumentsReady = files.length > 0 || processedDocuments.length > 0;
  const isFormValid = hasDocumentsReady && totalQuestions > 0 && isDistributionValid;

  const balanceQuestionsForTotal = (targetTotal) => {
    const clamped = Math.min(100, Math.max(1, Number(targetTotal) || 1));
    const base = Math.floor(clamped / 3);
    const remainder = clamped % 3;
    setTotalQuestions(clamped);
    setMcqs(base + (remainder > 0 ? 1 : 0));
    setShortQuestions(base + (remainder > 1 ? 1 : 0));
    setLongQuestions(base);
  };

  const handleAutoBalance = () => {
    balanceQuestionsForTotal(totalQuestions);
  };

  // -----------------------------------------------------------------------
  // FILE HANDLING
  // -----------------------------------------------------------------------
  const handleFiles = (selectedFiles) => {
    setError("");
    setUploadResult(null);
    clearExam();

    const incomingFiles = Array.from(selectedFiles);
    const supportedFiles = incomingFiles.filter((file) => {
      const filename = file.name.toLowerCase();
      return filename.endsWith(".pdf") || filename.endsWith(".docx");
    });

    if (supportedFiles.length < incomingFiles.length) {
      setError("Some unsupported files were skipped. Only .pdf and .docx are supported.");
    }

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const newFiles = supportedFiles.filter(
        (f) => !existing.has(`${f.name}-${f.size}`)
      );
      return [...prev, ...newFiles];
    });
  };

  const handleFileInput = (event) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setUploadResult(null);
    clearExam();
  };

  const clearFiles = () => {
    setFiles([]);
    setUploadResult(null);
    clearExam();
    setSelectedDocument(null);
    setIsSummaryOpen(false);
    setError("");
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileType = (filename) => {
    return filename.toLowerCase().endsWith(".pdf") ? "PDF" : "DOCX";
  };

  // -----------------------------------------------------------------------
  // UPLOAD DOCUMENTS
  // -----------------------------------------------------------------------
  const uploadDocuments = async () => {
    if (files.length === 0) {
      setError("Please upload at least one document.");
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    setUploadResult(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open("POST", `${API_URL}/api/documents/upload`);

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response);
            } else {
              reject(
                new Error(response.message || response.error || "Upload failed.")
              );
            }
          } catch {
            reject(new Error("Invalid response from server."));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Could not connect to backend server. Make sure it is running on port 5000."));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload was cancelled."));
        });

        xhr.send(formData);
      });

      const result = await uploadPromise;
      setUploadProgress(100);
      setUploadResult(result);
      return result;
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError.message || "Something went wrong while uploading.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // -----------------------------------------------------------------------
  // GENERATE EXAM
  // -----------------------------------------------------------------------
  const generateExam = async (documents) => {
    try {
      setLoading(true);
      setError("");

      if (!documents || documents.length === 0) {
        throw new Error("No processed documents are available.");
      }

      const documentIds = documents.map((doc) => doc.id).filter(Boolean);

      if (documentIds.length === 0) {
        throw new Error("Processed documents do not contain valid IDs.");
      }

      const response = await fetch(`${API_URL}/api/exams/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentIds,
          totalQuestions: Number(totalQuestions),
          mcqCount: Number(mcqs),
          shortCount: Number(shortQuestions),
          longCount: Number(longQuestions),
          difficulty: difficulty.toLowerCase(),
          focusTopics,
          includeAnswers,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response from exam-generation server.");
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to generate exam.");
      }

      if (data.data) {
        setGeneratedExam(data.data);
        if (onExamGenerated) onExamGenerated(data.data);
        return;
      }

      throw new Error("The server did not return valid exam questions.");
    } catch (err) {
      console.error("Exam generation error:", err);
      setError(err.message || "Something went wrong while generating the exam.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExam = async () => {
    if (!isFormValid) return;
    setError("");

    try {
      let docsToUse = processedDocuments;

      if (
        files.length > 0 &&
        (!uploadResult || !uploadResult.documents || uploadResult.documents.length === 0)
      ) {
        const currentResult = await uploadDocuments();
        if (
          !currentResult ||
          !currentResult.documents ||
          currentResult.documents.length === 0
        ) {
          const errorMsg =
            currentResult?.errors?.map((i) => `${i.filename}: ${i.error}`).join("\n") ||
            currentResult?.message ||
            "No documents were successfully processed.";
          throw new Error(errorMsg);
        }
        docsToUse = currentResult.documents;
      }

      if (!docsToUse || docsToUse.length === 0) {
        throw new Error("Please upload at least one document.");
      }

      clearExam();
      await generateExam(docsToUse);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate exam.");
    }
  };

  // -----------------------------------------------------------------------
  // EXPORT & PRINT
  // -----------------------------------------------------------------------
  const exportAsMarkdown = () => {
    if (!generatedExam || !generatedExam.questions) return;

    const hasAnswers = generatedExam.includeAnswers ?? includeAnswers;

    let md = `# ExamForge Generated Exam\n\n`;
    md += `**Total Questions:** ${generatedExam.totalQuestions}\n`;
    md += `**Difficulty:** ${generatedExam.difficulty || difficulty}\n`;
    if (generatedExam.focusTopics) {
      md += `**Focus Topics:** ${generatedExam.focusTopics}\n`;
    }
    md += `\n---\n\n`;

    generatedExam.questions.forEach((q, idx) => {
      md += `### Question ${idx + 1} (${q.type.toUpperCase()})\n\n`;
      md += `${q.question}\n\n`;

      if (q.type === "mcq" && q.options?.length > 0) {
        q.options.forEach((opt, oIdx) => {
          md += `* ${String.fromCharCode(65 + oIdx)}. ${opt}\n`;
        });
        md += `\n`;
      }

      if (hasAnswers) {
        if (q.correctAnswer) {
          md += `**Correct Answer:** ${q.correctAnswer}\n\n`;
        }
        if (q.answer) {
          md += `**Answer:** ${q.answer}\n\n`;
        }
        if (q.explanation) {
          md += `*Explanation:* ${q.explanation}\n\n`;
        }
        if (q.sourcePages?.length > 0) {
          md += `*Source Pages:* Page ${q.sourcePages.join(", ")}\n\n`;
        }
      }
      md += `---\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const examIncludesAnswers = generatedExam?.includeAnswers ?? includeAnswers;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14 print:py-4">
        {/* ==================================================
            HERO HEADER
        ================================================== */}
        <section className="mb-10 text-center print:hidden">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            ExamForge AI Generator
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Create exams <br />
            <span className="text-indigo-600">from your documents & PDFs</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Upload study materials, customize difficulty and question styles, and generate balanced exam papers with verified citations.
          </p>
        </section>

        {/* ==================================================
            GLOBAL ERROR NOTIFICATION
        ================================================== */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm print:hidden">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
              !
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Action required</p>
              <p className="mt-1 whitespace-pre-line text-xs sm:text-sm text-red-600">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-xs font-semibold text-red-400 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ==================================================
            STEP 1: UPLOAD DOCUMENTS
        ================================================== */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 print:hidden">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  1. Upload study material
                </h2>
                {files.length > 0 && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600 border border-indigo-100">
                    {files.length} {files.length === 1 ? "file" : "files"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Upload PDF or Word documents to extract context from.
              </p>
            </div>

            {(files.length > 0 || processedDocuments.length > 0) && (
              <button
                type="button"
                onClick={clearFiles}
                className="w-fit text-xs font-semibold text-slate-400 transition hover:text-red-600"
              >
                Clear all files
              </button>
            )}
          </div>

          {/* DROP ZONE */}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="group flex min-h-36 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-5 py-7 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30"
          >
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-600 transition group-hover:scale-105">
              ↑
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Drop documents here or{" "}
              <span className="text-indigo-600 font-bold hover:underline">
                browse files
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Supports PDF and Word (.docx) • Up to 25 MB per document
            </p>
          </label>

          {/* UPLOAD PROGRESS */}
          {isUploading && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Uploading and extracting text...
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* FILE LIST */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${
                        getFileType(file.name) === "PDF"
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}
                    >
                      {getFileType(file.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isUploading || loading}
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${file.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-red-600 disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ==================================================
            STEP 2: SELECT EXAM PREFERENCES
        ================================================== */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 print:hidden">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              2. Select exam preferences
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure question counts, difficulty, and optional topic focus.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Total questions (1–100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalQuestions}
                onChange={(e) => balanceQuestionsForTotal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 font-semibold"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 font-medium"
              >
                <option value="Mixed">Mixed (Balanced)</option>
                <option value="Easy">Easy (Fundamental)</option>
                <option value="Medium">Medium (Application)</option>
                <option value="Hard">Hard (Analytical & Deep)</option>
              </select>
            </div>
          </div>

          {/* QUESTION TYPE SPLIT */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <QuestionType
              title="Multiple Choice"
              description="4-choice questions"
              value={mcqs}
              onChange={setMcqs}
            />
            <QuestionType
              title="Short Answer"
              description="Concise responses"
              value={shortQuestions}
              onChange={setShortQuestions}
            />
            <QuestionType
              title="Long Answer"
              description="Detailed explanations"
              value={longQuestions}
              onChange={setLongQuestions}
            />
          </div>

          {/* DISTRIBUTION BANNER + AUTO-BALANCE BUTTON */}
          <div
            className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
              isDistributionValid
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>Question distribution:</span>
              <strong>
                {questionSum} / {totalQuestions}
              </strong>
              {isDistributionValid ? (
                <span className="text-xs font-semibold text-emerald-600">✓ Balanced</span>
              ) : (
                <span className="text-xs font-semibold text-amber-600">
                  (Difference: {Math.abs(totalQuestions - questionSum)})
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleAutoBalance}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold shadow-sm transition hover:bg-slate-50 border border-slate-200 text-slate-700"
            >
              Auto-Balance
            </button>
          </div>

          {/* FOCUS TOPICS */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Focus topics{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={focusTopics}
              onChange={(e) => setFocusTopics(e.target.value)}
              placeholder="e.g. Nervous system, cellular respiration, enzyme kinetics..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 text-sm"
            />
          </div>

          {/* ANSWER KEY TOGGLE */}
          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={includeAnswers}
              onChange={(e) => setIncludeAnswers(e.target.checked)}
              className="mt-1 h-4 w-4 accent-indigo-600"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Generate answer key & detailed explanations
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Include verified answers, explanations, and page citations.
              </p>
            </div>
          </label>
        </section>

        {/* ==================================================
            PROCESSED DOCUMENTS / SUMMARY ACCESS
        ================================================== */}
        {processedDocuments.length > 0 && (
          <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 print:hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <span>✓</span> Processed Documents ({processedDocuments.length})
              </h3>
            </div>

            <div className="space-y-2">
              {processedDocuments.map((doc) => {
                const words = doc.word_count ?? doc.wordCount ?? 0;
                const pages = doc.page_count ?? 1;
                return (
                  <div
                    key={doc.id || doc.filename}
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-slate-400">
                        {Number(words).toLocaleString()} words • {pages}{" "}
                        {pages === 1 ? "page" : "pages"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openSummary(doc)}
                      className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-100 transition hover:bg-indigo-100"
                    >
                      View Summary
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================================================
            GENERATE ACTION BUTTON
        ================================================== */}
        <section className="py-4 text-center print:hidden">
          <button
            type="button"
            disabled={!isFormValid || isUploading || loading}
            onClick={handleGenerateExam}
            className="inline-flex min-w-64 items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isUploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing documents...</span>
              </>
            ) : loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Generating questions with Gemini...</span>
              </>
            ) : (
              <>
                <span>Generate Exam</span>
                <span className="text-lg">→</span>
              </>
            )}
          </button>

          {!hasDocumentsReady && (
            <p className="mt-2 text-xs text-slate-400">
              Upload at least one document to start.
            </p>
          )}

          {hasDocumentsReady && !isDistributionValid && (
            <p className="mt-2 text-xs text-amber-600">
              Question count doesn't match total. Click "Auto-Balance" above.
            </p>
          )}
        </section>

        {/* ==================================================
            GENERATED EXAM VIEW
        ================================================== */}
        {generatedExam && (
          <section className="mt-10 space-y-6 print:mt-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Generated Exam
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {generatedExam.totalQuestions ||
                      generatedExam.questions?.length ||
                      0}{" "}
                    questions • Difficulty: {generatedExam.difficulty || difficulty}
                  </p>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={exportAsMarkdown}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    {copiedExport ? "✓ Copied" : "📋 Copy Markdown"}
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    🖨️ Print
                  </button>

                  <button
                    type="button"
                    onClick={clearFiles}
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-100"
                  >
                    Clear Exam
                  </button>
                </div>
              </div>

              {/* DOCUMENT CONTRIBUTION */}
              {generatedExam.documents?.length > 1 && (
                <div className="mt-5 print:hidden">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Proportional Source Allocation
                  </p>
                  <div className="space-y-1.5">
                    {generatedExam.documents.map((doc) => (
                      <div
                        key={doc.id || doc.filename}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
                      >
                        <span className="truncate font-medium text-slate-700">
                          {doc.filename}
                        </span>
                        <span className="font-bold text-indigo-600">
                          {doc.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QUESTIONS LIST */}
            {generatedExam.questions?.map((q, index) => {
              const showQuestionAnswer =
                examIncludesAnswers ||
                Boolean(q.correctAnswer || q.answer || q.explanation);

              return (
                <div
                  key={q.uid || q.id || index}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 print:break-inside-avoid print:shadow-none"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-extrabold uppercase text-indigo-600 border border-indigo-100">
                        {q.type}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Question {q.id || index + 1}
                      </span>
                    </div>

                    {q.filename && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        Source: {q.filename}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold leading-relaxed text-slate-900">
                    {q.question}
                  </h3>

                  {/* MCQ OPTIONS */}
                  {q.type === "mcq" && q.options?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {q.options.map((option, optIdx) => (
                        <div
                          key={optIdx}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-700"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 border border-slate-200">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* VIEW ANSWER BUTTON */}
                  {showQuestionAnswer && (
                    <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between print:hidden">
                      <button
                        type="button"
                        onClick={() => openAnswerPanel(q)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-600 border border-indigo-100 transition hover:bg-indigo-100"
                      >
                        <span>View Answer & Tutor Discussion</span>
                        <span>→</span>
                      </button>

                      {q.sourcePages?.length > 0 && (
                        <span className="text-xs text-slate-400">
                          Page {q.sourcePages.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </main>

      {/* ==================================================
          INLINE ANSWER PANEL / DRAWER
      ================================================== */}
      {isAnswerPanelOpen && activeAnswerQuestion && (
        <AnswerPanelModal
          question={activeAnswerQuestion}
          onClose={closeAnswerPanel}
        />
      )}

      {/* ==================================================
          INLINE SUMMARY PANEL / MODAL
      ================================================== */}
      {isSummaryOpen && selectedDocument && (
        <SummaryPanelModal
          document={selectedDocument}
          onClose={closeSummary}
        />
      )}
    </div>
  );
}

// =========================================================================
// SUBCOMPONENTS
// =========================================================================
function QuestionType({ title, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

// INLINE ANSWER & TUTOR MODAL
function AnswerPanelModal({ question, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="relative h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold uppercase text-indigo-600 border border-indigo-100">
              {question.type}
            </span>
            <h3 className="mt-1 font-bold text-slate-900 text-lg">
              Answer & Explanation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-400">Question</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {question.question}
            </p>
          </div>

          {question.correctAnswer && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-xs font-bold uppercase text-emerald-700">
                Correct Answer
              </p>
              <p className="mt-1 text-sm font-bold text-emerald-900">
                {question.correctAnswer}
              </p>
            </div>
          )}

          {question.answer && !question.correctAnswer && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <p className="text-xs font-bold uppercase text-indigo-700">
                Model Solution
              </p>
              <p className="mt-1 text-sm text-slate-800 whitespace-pre-line">
                {question.answer}
              </p>
            </div>
          )}

          {question.explanation && (
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Detailed Explanation
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {question.explanation}
              </p>
            </div>
          )}

          {question.sourcePages?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
              <span>📖 Document Citations:</span>
              <span className="font-semibold text-slate-700">
                Page {question.sourcePages.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// INLINE DOCUMENT SUMMARY MODAL
function SummaryPanelModal({ document, onClose }) {
  const words = document.word_count ?? document.wordCount ?? 0;
  const pages = document.page_count ?? 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {document.filename || "Document Summary"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {Number(words).toLocaleString()} words • {pages}{" "}
              {pages === 1 ? "page" : "pages"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4 text-sm text-slate-700">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Executive Summary
            </h4>
            <p className="leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {document.summary ||
                "This document has been indexed and analyzed by ExamForge. Its content is ready to be used as context for verified question generation with full page citations."}
            </p>
          </div>

          {document.topics?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Identified Key Topics
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {document.topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}