import { useEffect, useRef, useState } from "react";
import API_URL from "../config/api";

const POLL_INTERVAL_MS = 1000;
// Mirrors the backend's own 30s hard cap (INDEXING_TIMEOUT_MS in
// indexServiceControllers.js). This is a client-side safety net: if the
// backend ever fails to report back in time — a dropped connection, a
// request that hangs before the server-side timeout logic even runs — the
// UI stops waiting here instead of spinning forever. "Indexing should
// never take more than 30 seconds" should hold from the user's point of
// view no matter what the server does.
const CLIENT_TIMEOUT_S = 30;

export default function UploadPDF({ onReadyChange, onFileNameChange }) {
  const [pendingFile, setPendingFile] = useState(null); // File currently uploading/last attempted
  const [readyFileName, setReadyFileName] = useState(null); // name of the currently indexed PDF
  const [phase, setPhase] = useState("idle"); // idle | uploading | processing | ready | error
  const [message, setMessage] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const inputRef = useRef(null);

  const stopTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  };

  // On mount, check whether a PDF is already indexed from a previous
  // session (the backend restores it on restart) so this doesn't show
  // a blank/misleading state after a page refresh.
  useEffect(() => {
    // no-store: avoid a stale cached/304 answer masking the real state.
    fetch(`${API_URL}upload/status`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.state === "ready") {
          setPhase("ready");
          setReadyFileName(data.fileName);
          onFileNameChange?.(data.fileName);
          setMessage(
            data.fileName
              ? `Ready to chat — "${data.fileName}" is indexed.`
              : "Ready to chat — a previously indexed PDF was restored."
          );
          onReadyChange?.(true);
        }
      })
      .catch(() => {});

    return stopTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollStatus = () => {
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsedSec = Math.round((Date.now() - startRef.current) / 1000);
      setElapsed(elapsedSec);

      if (elapsedSec >= CLIENT_TIMEOUT_S) {
        stopTimers();
        setPhase("error");
        setMessage(
          `Indexing didn't finish within ${CLIENT_TIMEOUT_S} seconds, so we stopped waiting. This usually means the backend is unreachable or a request to OpenAI is stuck — check your backend is running and try again.`
        );
        onReadyChange?.(false);
      }
    }, 250);

    pollRef.current = setInterval(async () => {
      try {
        // no-store: same reasoning as the mount-time check above — this is
        // polled specifically to catch state changes, so a cached 304 that
        // silently keeps returning an old snapshot defeats the whole point.
        const res = await fetch(`${API_URL}upload/status`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (data.state === "ready") {
          stopTimers();
          setPhase("ready");
          setReadyFileName(data.fileName);
          onFileNameChange?.(data.fileName);
          setMessage(
            data.tookMs
              ? `Ready to chat — indexed in ${(data.tookMs / 1000).toFixed(
                  1
                )}s.`
              : "Ready to chat."
          );
          onReadyChange?.(true);
        } else if (data.state === "error") {
          stopTimers();
          setPhase("error");
          setMessage(data.error || "Indexing failed.");
          onReadyChange?.(false);
        }
        // otherwise still "processing" — keep polling
      } catch {
        // transient network hiccup while polling; try again next tick
      }
    }, POLL_INTERVAL_MS);
  };

  const startUpload = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setPhase("error");
      setMessage("Only PDF files are supported.");
      return;
    }

    stopTimers();
    onReadyChange?.(false);
    setPendingFile(selectedFile);
    setPhase("uploading");
    setMessage("");
    setElapsed(0);

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      const res = await fetch(`${API_URL}upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Upload failed (status ${res.status})`);
      }

      setPhase("processing");
      pollStatus();
    } catch (err) {
      console.error(err);
      setPhase("error");
      setMessage(
        err.message === "Failed to fetch"
          ? "Could not reach the server. Is the backend running?"
          : err.message
      );
    }
  };

  const busy = phase === "uploading" || phase === "processing";

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (busy) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) startUpload(dropped);
  };

  const openPicker = () => {
    if (!busy) inputRef.current?.click();
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/20 p-6 border border-white/10 text-left transition-colors hover:border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-lg">
          📁
        </span>
        <h2 className="text-lg font-semibold text-slate-100">Upload PDF</h2>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors outline-none
          ${busy ? "cursor-not-allowed opacity-70 border-white/10" : "cursor-pointer"}
          ${
            dragActive
              ? "border-indigo-400 bg-indigo-500/10"
              : "border-white/15 hover:border-indigo-400/50 hover:bg-white/[0.03]"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => startUpload(e.target.files?.[0])}
          disabled={busy}
          className="hidden"
        />

        {!busy && phase !== "ready" && (
          <>
            <div className="text-2xl mb-1">📄</div>
            <p className="text-sm text-slate-300">
              <span className="text-indigo-400 font-medium">
                Click to upload
              </span>{" "}
              or drag and drop a PDF
            </p>
          </>
        )}

        {busy && (
          <div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-indigo-400 animate-spin" />
              {phase === "uploading"
                ? "Uploading your file…"
                : `Indexing "${pendingFile?.name ?? "PDF"}"… ${elapsed}s`}
            </div>
            <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="absolute inset-y-0 w-1/3 rounded-full bg-linear-to-r from-cyan-400 via-indigo-400 to-violet-400 animate-progress-indeterminate" />
            </div>
          </div>
        )}

        {!busy && phase === "ready" && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
            <span className="text-lg">📄</span>
            <span className="truncate max-w-[220px]">
              {readyFileName ?? "PDF indexed"}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-indigo-400 font-medium">
              Click to replace
            </span>
          </div>
        )}
      </div>

      {!busy && message && (
        <p
          className={`mt-3 text-sm flex items-center gap-1.5 animate-fade-in-up ${
            phase === "error" ? "text-rose-400" : "text-emerald-400"
          }`}
        >
          <span>{phase === "error" ? "⚠️" : "✅"}</span>
          <span>{message}</span>
          {phase === "error" && pendingFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startUpload(pendingFile);
              }}
              className="ml-1 underline decoration-dotted text-rose-300 hover:text-rose-200 transition-colors"
            >
              Try again
            </button>
          )}
        </p>
      )}
    </div>
  );
}
