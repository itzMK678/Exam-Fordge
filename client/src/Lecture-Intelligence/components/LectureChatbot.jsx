import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Clock, Sparkles, Loader2, MessageSquare } from "lucide-react";
import MarkdownRenderer from "../../components/MarkdownRenderer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LectureChatbot({ lectureId, lectureTitle = "Lecture" }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I am your AI Lecture Tutor for **${lectureTitle}**. Ask me any question about what your teacher covered, and I will explain it using exact moments and timestamps from the class!`,
      timestamps: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const query = questionText || input;
    if (!query.trim() || loading) return;

    setInput("");
    const newMessages = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/lectures/${lectureId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: query }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to get tutor answer.");
      }

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.reply,
          timestamps: data.timestamps || [],
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `⚠️ Error: ${err.message || "Could not reach the AI Lecture Tutor."}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What was the core conclusion of the lecture?",
    "Explain the teacher's example in simple terms",
    "What questions did students ask during class?",
    "Which formulas or theorems should I memorize for exams?",
  ];

  return (
    <div className="flex h-[600px] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Lecture Tutor</h3>
            <p className="text-[11px] text-slate-500">
              Grounded exclusively in this classroom session
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                msg.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed sm:text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : msg.isError
                  ? "border border-rose-200 bg-rose-50 text-rose-700"
                  : "border border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <>
                  <MarkdownRenderer content={msg.content} />
                  {msg.timestamps && msg.timestamps.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200/60 pt-2 text-[10px] text-slate-500">
                      <span className="font-bold">Referenced Timestamps:</span>
                      {msg.timestamps.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="flex items-center gap-1 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 font-bold text-blue-700"
                        >
                          <Clock size={10} /> {t}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="animate-spin text-blue-600" size={16} />
            <span>AI Tutor is reviewing the lecture recording...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 sm:p-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about what was taught in this lecture..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
