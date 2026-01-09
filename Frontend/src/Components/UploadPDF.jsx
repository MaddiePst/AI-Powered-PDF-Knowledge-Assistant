import { useState } from "react";

export default function UploadPDF() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const uploadPDF = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);

    setStatus("Uploading...");

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      setStatus(data.message);
    } catch (err) {
      console.error(err);
      setStatus("Upload failed");
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-white">
      <h2 className="text-lg font-semibold text-blue-900 border-2 rounded-2xl mb-3">
        📁 Upload PDF
      </h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-slate-900
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:bg-indigo-600 file:text-indigo-100
                     hover:file:bg-indigo-100 hover:file:text-indigo-700"
        />

        <button
          onClick={uploadPDF}
          className="bg-indigo-600 hover:bg-indigo-800 text-white px-5 py-2 rounded-lg transition font-medium"
        >
          Upload
        </button>
      </div>

      {status && <p className="mt-3 text-sm text-slate-600">{status}</p>}
    </div>
  );
}
