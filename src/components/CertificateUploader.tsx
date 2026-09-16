"use client";

import { useState } from "react";

export default function CertificateUploader({
  onHashGenerated,
}: {
  onHashGenerated: (hash: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/certificates/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.certificateHash) {
      onHashGenerated(data.certificateHash);
    }
    setUploading(false);
  };

  return (
    <div className="p-4 border border-slate-700 rounded-lg bg-slate-800">
      <label className="block text-sm font-medium mb-2 text-slate-300">
        Attach Form 8130-3 / Certificate
      </label>
      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white"
      />
      {uploading && <p className="text-xs text-cyan-400 mt-2">Computing SHA-256 hash...</p>}
    </div>
  );
}