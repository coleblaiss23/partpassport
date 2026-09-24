"use client";

import { useState } from "react";
import { btnSecondary } from "@/components/ui";
import {
 buildCfr439RtsDraft,
 canGenerateRtsDraft,
 type RtsDraftInput,
} from "@/lib/rtsDraft";
import type { Extracted } from "@/lib/certChecks";

type Props = {
 extracted: Extracted;
 organizationName?: string | null;
 faaCertNumber?: string | null;
};

export function RtsDraftGenerator({
 extracted,
 organizationName,
 faaCertNumber,
}: Props) {
 const [draft, setDraft] = useState<string | null>(null);
 const [copied, setCopied] = useState(false);

 if (!canGenerateRtsDraft(extracted)) return null;

 function generate() {
 const input: RtsDraftInput = {
 extracted,
 organizationName,
 faaCertNumber,
 };
 setDraft(buildCfr439RtsDraft(input));
 setCopied(false);
 }

 async function copy() {
 if (!draft) return;
 try {
 await navigator.clipboard.writeText(draft);
 setCopied(true);
 } catch {
 setCopied(false);
 }
 }

 return (
 <div className="space-y-3 border border-[#1F2430] bg-[#12151C] p-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <h3 className="text-sm font-semibold text-white">
 14 CFR 43.9 Return-to-Service Draft
 </h3>
 <p className="mt-1 text-xs text-[#B0B6C3]">
 One-click maintenance record text block for logbook entry. Verify
 against the original release before use.
 </p>
 </div>
 <button type="button" className={btnSecondary} onClick={generate}>
 {draft ? "Regenerate draft" : "Generate 43.9 RTS draft"}
 </button>
 </div>
 {draft && (
 <div className="space-y-2">
 <pre className="max-h-64 overflow-auto border border-[#1F2430] bg-[#0B0F14] p-3 pp-track text-[11px] leading-relaxed text-[#B0B6C3] whitespace-pre-wrap">
 {draft}
 </pre>
 <button type="button" className={btnSecondary} onClick={copy}>
 {copied ? "Copied to clipboard" : "Copy for logbook"}
 </button>
 </div>
 )}
 </div>
 );
}
