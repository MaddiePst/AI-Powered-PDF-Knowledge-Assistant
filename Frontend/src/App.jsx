import { useEffect, useState } from "react";
import "./App.css";

import UploadPDF from "./Components/UploadPDF";
import Chat from "./Components/Chat";
import API_URL from "./config/api";

export default function App() {
  // Whether a PDF has been indexed and chat is usable. Starts as "unknown"
  // (null) until we've checked, so we don't flash a misleading state.
  const [indexReady, setIndexReady] = useState(null);
  // Name of the PDF currently indexed, shown in the chat header so the two
  // cards read as one connected flow instead of two separate widgets.
  const [activeFileName, setActiveFileName] = useState(null);

  // On load, check whether the backend already has an index from a
  // previous session (it restores one on restart) so Chat doesn't stay
  // disabled unnecessarily after a page refresh.
  useEffect(() => {
    let cancelled = false;

    // no-store: this is a polled status endpoint, its answer must always be
    // live — a browser-cached 304 here would make the app think indexing
    // never started/finished when it actually did.
    fetch(`${API_URL}upload/status`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setIndexReady(data.state === "ready");
        if (data.state === "ready") setActiveFileName(data.fileName);
      })
      .catch(() => {
        if (!cancelled) setIndexReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-200 ">
      {/* Page container */}
      <div className="max-w-4xl mx-auto px-4 py-14 space-y-12">
        {/* Main */}
        <main className="text-center space-y-6 mt-3">
          {/* Primary title */}
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight
            bg-linear-to-r from-cyan-400 via-indigo-400 to-violet-400
            bg-clip-text text-transparent"
          >
            AI-Powered PDF Knowledge Assistant
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Upload documents and start asking questions for the AI to answer.
          </p>

          {/* App content */}
          <div className="mt-10 space-y-6">
            <UploadPDF
              onReadyChange={setIndexReady}
              onFileNameChange={setActiveFileName}
            />
            <Chat ready={!!indexReady} fileName={activeFileName} />
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-md text-slate-500 pt-10">
          Where Documents Meet Intelligence
        </footer>
      </div>
    </div>
  );
}
