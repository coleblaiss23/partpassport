"use client";

import { useCallback, useState } from "react";
import { btnPrimary } from "@/components/ui";

type UploadResult = {
  id: string;
  fileName: string;
  kind: string;
  status: string;
  sha256?: string | null;
  createdAt: string;
};

export function DocumentDropzone({
  kind = "LOGBOOK",
  aircraftId,
  onUploaded,
}: {
  kind?: "LOGBOOK" | "INVOICE" | "CERTIFICATE" | "OTHER";
  aircraftId?: string;
  onUploaded?: (upload: UploadResult) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [last, setLast] = useState<UploadResult | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setBusy(true);
      setErr("");
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", kind);
        if (aircraftId) fd.append("aircraftId", aircraftId);
        const r = await fetch("/api/uploads", { method: "POST", body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErr(j.error ?? "Upload failed");
          setBusy(false);
          return;
        }
        setLast(j.upload);
        onUploaded?.(j.upload);
        setBusy(false);
      } catch {
        setErr("Network error");
        setBusy(false);
      }
    },
    [aircraftId, kind, onUploaded],
  );

  function onFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) void uploadFile(f);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`rounded-[4px] border border-dashed p-8 text-center transition ${
          drag ? "border-[#c8c2b8] bg-[#171717]" : "border-[#2c2c2c] bg-[#111111]"
        }`}
      >
        <p className="text-sm font-medium text-white">
          Drop scanned logbook or maintenance invoice
        </p>
        <p className="mt-1 text-xs text-[#8d877e]">PDF or image · max 25 MB · OCR queue next</p>
        <label className={`mt-4 inline-flex cursor-pointer ${btnPrimary}`}>
          {busy ? "Uploading…" : "Choose file"}
          <input
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
      </div>
      {err && <p className="text-xs text-[#FFE4E6]">{err}</p>}
      {last && (
        <p className="text-xs text-[#c8c2b8]">
          Queued <span className="pp-track text-white">{last.fileName}</span> · {last.status}
        </p>
      )}
    </div>
  );
}
