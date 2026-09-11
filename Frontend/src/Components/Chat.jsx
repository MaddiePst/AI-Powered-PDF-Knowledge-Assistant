import { useState, useRef, useEffect } from "react";
import API_URL from "../config/api";

export default function Chat({ ready = true, fileName = null }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Skip on initial mount (empty messages) — scrollIntoView here can pull
    // the whole page down to this card instead of just scrolling the
    // message list, which is why the page used to open at the bottom.
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  // Move focus straight to the input the moment chat becomes usable, so
  // uploading and asking a question feels like one continuous action.
  useEffect(() => {
    if (ready) inputRef.current?.focus();
  }, [ready]);

  const askQuestion = async () => {
    if (!question.trim() || !ready) return;

    const userMsg = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");

    try {
      const res = await fetch(`${API_URL}chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.text }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed (status ${res.status})`);
      }

      setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            err.message === "Failed to fetch"
              ? "Could not reach the server. Is the backend running?"
              : err.message,
        },
      ]);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/20 border border-white/10 flex flex-col h-125 text-left transition-colors hover:border-white/20">
      {/* Header — ties this card to whichever PDF is currently indexed */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">Chat</h2>
        {ready && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="truncate max-w-[180px]">
              {fileName ?? "PDF indexed"}
            </span>
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-sm text-slate-500 px-6">
            {ready
              ? "💬 Ask a question about your PDF to get started."
              : "📄 Upload a PDF above to start chatting."}
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex animate-fade-in-up ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-white/10 text-slate-100 rounded-bl-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4 flex gap-2">
        <input
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askQuestion()}
          disabled={!ready}
          placeholder={
            ready ? "Ask a question about your PDF..." : "Upload a PDF first…"
          }
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2
                     text-slate-100 placeholder:text-slate-500 transition
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={askQuestion}
          disabled={!ready || !question.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40
                     disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg
                     font-medium transition-all hover:shadow-lg
                     hover:shadow-indigo-500/30 active:scale-95"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
