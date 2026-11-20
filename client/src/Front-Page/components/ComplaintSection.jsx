import React, { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { useAuth } from "../../Context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ComplaintSection = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });

  const effectiveEmail = user?.email || guestEmail.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: null, message: "" });

    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      setFeedback({
        type: "error",
        message: "Please enter your complaint message before sending.",
      });
      return;
    }

    if (!effectiveEmail) {
      setFeedback({
        type: "error",
        message: "Please enter your email so we can send you a confirmation copy.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(effectiveEmail)) {
      setFeedback({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/admin/complaint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: trimmedMsg,
          email: effectiveEmail,
          name: user?.name || effectiveEmail.split("@")[0],
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit complaint. Please try again.");
      }

      setFeedback({
        type: "success",
        message: `Your complaint has been submitted. A confirmation email has been sent to ${effectiveEmail}.`,
      });
      setMessage("");
      if (!user?.email) {
        setGuestEmail("");
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className=" px-5 py-14 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          

          <h2 className="text-2xl font-bold tracking-tight text-blue-700 sm:text-3xl">
            Have a Complaint or Found an Issue?
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-800">
            Send your complaint directly to our team. Both you and our admin will automatically receive an email copy.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback.type && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm transition-all ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-white text-emerald-300"
                : "border-rose-500/30 bg-white text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
            )}
            <div className="flex-1">{feedback.message}</div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-white p-6 shadow-xl backdrop-blur-sm">
          {/* User state indicator */}
          {user?.email ? (
            <div className="mb-3 flex items-center justify-between text-xs text-slate-800">
              <span>
                Sending as: <strong className="text-blue-400">{user.email}</strong>
              </span>
              <span className="text-slate-500">Confirmation will be sent to your inbox</span>
            </div>
          ) : (
            <div className="mb-3">
              <label htmlFor="complaint-guest-email" className="block text-xs font-medium text-slate-400 bg-white mb-1.5">
                Your Email Address (for confirmation receipt):
              </label>
              <input
                id="complaint-guest-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={loading}
                className="w-full rounded-xl bg-white border border-slate-700 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          )}

          {/* Single input field of message with send button */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your complaint or issue here..."
              disabled={loading}
              className="flex-1 rounded-xl bg-white border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-white shadow-sm transition shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ComplaintSection;
