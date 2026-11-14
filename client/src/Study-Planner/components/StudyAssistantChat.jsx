import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  User,
  Bot,
  X,
  BookOpen,
  HelpCircle,
  BrainCircuit,
  MessageSquare,
} from "lucide-react";

export default function StudyAssistantChat({
  plan,
  isOpen,
  onClose,
  initialPrompt,
}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm your AI Study Assistant for "${plan?.title || "your active study plan"}". I can explain difficult topics from your uploaded materials, generate rapid practice quizzes, or advise you on what to prioritize next. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text || !text.trim() || loading) return;

    const userMsg = { role: "user", content: text.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/study-planner/${plan.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text.trim(),
          history: newHistory.slice(-6),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "AI Tutor request failed.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error communicating with AI Tutor: ${err.message}. Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What should I study right now?",
    "Give me a 3-question quiz on today's topic",
    "Explain the core concept from my notes simply",
    "How can I memorize formulas for this exam?",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-all sm:max-w-lg">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              AI Study Assistant & Tutor
            </h3>
            <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
              {plan?.title}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                isUser ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isUser
                    ? "bg-slate-900 text-white"
                    : "bg-indigo-600 text-white shadow-2xs"
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={16} />}
              </div>

              <div
                className={`rounded-2xl p-3.5 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  isUser
                    ? "bg-indigo-600 text-white font-medium"
                    : "bg-slate-50 border border-slate-200 text-slate-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Bot size={16} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
              <span>Thinking with your study material...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/50">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSend(qp)}
              className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition shrink-0 cursor-pointer"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t border-slate-200 p-3 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about formulas, today's topics, or quizzes..."
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition shadow-xs cursor-pointer shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
