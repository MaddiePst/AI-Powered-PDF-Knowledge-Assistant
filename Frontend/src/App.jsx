import "./App.css";

import UploadPDF from "./Components/UploadPDF";
import Chat from "./Components/Chat";

export default function App() {
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
            <UploadPDF />
            <Chat />
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
