"use client";

import { useState } from "react";
import Link from "next/link";
import { OverviewTab, type AircraftOverview } from "./tabs/OverviewTab";
import { ActiveADsTab, type AdStatusRow } from "./tabs/ActiveADsTab";
import { LifeLimitedTab, type LlpRow } from "./tabs/LifeLimitedTab";
import { ComplianceHistoryTab } from "./tabs/ComplianceHistoryTab";
import { InvoicesTab, type InvoiceRow } from "./tabs/InvoicesTab";
import { btnSecondary } from "@/components/ui";

type TabId = "overview" | "ads" | "llp" | "history" | "invoices";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "ads", label: "Active ADs" },
  { id: "llp", label: "Life-Limited Parts" },
  { id: "history", label: "Compliance History" },
  { id: "invoices", label: "Invoices" },
];

export function TailDashboard({
  aircraft,
  adStatuses,
  lifeLimited,
  invoices,
}: {
  aircraft: AircraftOverview;
  adStatuses: AdStatusRow[];
  lifeLimited: LlpRow[];
  invoices: InvoiceRow[];
}) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#8d877e]">
            <Link href="/dashboard/fleet" className="hover:text-white">
              Fleet
            </Link>
            {" / "}
            Tail
          </p>
          <h1 className="pp-track mt-1 text-3xl font-semibold tracking-tight text-white">
            {aircraft.tailNumber}
          </h1>
          <p className="mt-1 text-sm text-[#c8c2b8]">
            {aircraft.make} {aircraft.model}
            {aircraft.year != null ? ` · ${aircraft.year}` : ""}
          </p>
        </div>
        <Link href="/dashboard/uploads" className={btnSecondary}>
          Upload logbook / invoice
        </Link>
      </div>

      <div
        className="inline-flex flex-wrap gap-1 rounded-[4px] border border-[#2c2c2c] bg-[#111111] p-1"
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-[4px] px-3 py-1.5 text-sm ${
              tab === t.id ? "bg-[#171717] text-white" : "text-[#c8c2b8] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "overview" && <OverviewTab aircraft={aircraft} />}
        {tab === "ads" && <ActiveADsTab items={adStatuses} />}
        {tab === "llp" && <LifeLimitedTab items={lifeLimited} />}
        {tab === "history" && <ComplianceHistoryTab items={adStatuses} />}
        {tab === "invoices" && <InvoicesTab items={invoices} />}
      </div>
    </div>
  );
}
