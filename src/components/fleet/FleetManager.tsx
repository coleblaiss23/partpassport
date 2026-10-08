"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AircraftCard, type AircraftListItem } from "@/components/fleet/AircraftCard";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

type Template = {
  make: string;
  model: string;
  series?: string | null;
  engineModel?: string | null;
};

export function FleetManager({
  initial,
  aircraftLimit,
}: {
  initial: AircraftListItem[];
  aircraftLimit: number;
}) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [tailNumber, setTailNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [engineModel, setEngineModel] = useState("");
  const [airframeHours, setAirframeHours] = useState("");
  const [busy, setBusy] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [err, setErr] = useState("");
  const [lookupNote, setLookupNote] = useState("");
  const [previewAds, setPreviewAds] = useState<number | null>(null);
  const [needsManual, setNeedsManual] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateKey, setTemplateKey] = useState("");

  const atCap = Number.isFinite(aircraftLimit) && list.length >= aircraftLimit;

  function resetForm() {
    setErr("");
    setLookupNote("");
    setPreviewAds(null);
    setNeedsManual(false);
    setTailNumber("");
    setMake("");
    setModel("");
    setYear("");
    setSerialNumber("");
    setEngineModel("");
    setAirframeHours("");
    setTemplateKey("");
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  useEffect(() => {
    if (!modalOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/aircraft/lookup?templates=1");
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { templates?: Template[] };
        if (!cancelled) setTemplates(j.templates ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modalOpen]);

  async function lookupTail(raw: string) {
    const tail = raw.trim().toUpperCase();
    if (tail.length < 3) {
      setLookupNote("");
      setPreviewAds(null);
      setNeedsManual(false);
      return;
    }
    setLookingUp(true);
    setErr("");
    try {
      const r = await fetch(`/api/aircraft/lookup?tail=${encodeURIComponent(tail)}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setLookingUp(false);
        return;
      }
      if (j.found && j.registry) {
        const reg = j.registry as {
          make: string;
          model: string;
          year: number | null;
          serialNumber: string | null;
          engineModel: string | null;
          source: string;
        };
        setMake(reg.make);
        setModel(reg.model);
        setYear(reg.year != null ? String(reg.year) : "");
        setSerialNumber(reg.serialNumber ?? "");
        setEngineModel(reg.engineModel ?? "");
        setNeedsManual(false);
        setPreviewAds(typeof j.previewAdCount === "number" ? j.previewAdCount : null);
        setLookupNote(
          `Registry hit (${reg.source}): ${reg.make} ${reg.model}` +
            (typeof j.previewAdCount === "number"
              ? ` · ${j.previewAdCount} matching AD${j.previewAdCount === 1 ? "" : "s"}`
              : ""),
        );
      } else {
        setNeedsManual(true);
        setPreviewAds(null);
        setLookupNote(
          "No registry match for this tail. Enter make/model or pick a template to still link ADs.",
        );
      }
    } catch {
      setNeedsManual(true);
      setLookupNote("Registry lookup unavailable. Enter make/model manually.");
    }
    setLookingUp(false);
  }

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const t = templates.find((x) => `${x.make}|${x.model}` === key);
    if (!t) return;
    setMake(t.make);
    setModel(t.model);
    if (t.engineModel) setEngineModel(t.engineModel);
    setNeedsManual(false);
    setLookupNote(`Template: ${t.make} ${t.model} — ADs will match on save.`);
    setPreviewAds(null);
  }

  async function addAircraft(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/aircraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailNumber: tailNumber.trim().toUpperCase(),
          make: make.trim(),
          model: model.trim(),
          year: year ? Number(year) : undefined,
          serialNumber: serialNumber.trim() || undefined,
          engineModel: engineModel.trim() || undefined,
          airframeHours: airframeHours ? Number(airframeHours) : undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 422) {
          setNeedsManual(true);
          setErr(j.error ?? "Enter make and model manually");
        } else {
          setErr(j.error ?? "Could not add aircraft");
        }
        setBusy(false);
        return;
      }
      const openAds =
        typeof j.aircraft?.openAds === "number"
          ? j.aircraft.openAds
          : typeof j.enrichment?.adsLinked === "number"
            ? j.enrichment.adsLinked
            : 0;
      setList((prev) => [
        {
          id: j.aircraft.id,
          tailNumber: j.aircraft.tailNumber,
          make: j.aircraft.make,
          model: j.aircraft.model,
          year: j.aircraft.year ?? null,
          airframeHours: j.aircraft.airframeHours ?? null,
          openAds,
        },
        ...prev,
      ]);
      setBusy(false);
      closeModal();
      router.refresh();
    } catch {
      setErr("Network error");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#c8c2b8]">
          {list.length} aircraft
          {Number.isFinite(aircraftLimit) ? ` · ${list.length} of ${aircraftLimit} on plan` : ""}
        </p>
        <button
          type="button"
          disabled={atCap}
          onClick={() => setModalOpen(true)}
          className={btnPrimary}
        >
          Add aircraft
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <AircraftCard key={a.id} aircraft={a} />
        ))}
        {list.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3 space-y-3">
            <p className="text-sm text-[#c8c2b8]">
              No aircraft yet. Add a tail number to open the Tail Number Dashboard with ADs,
              life-limited parts, and invoices.
            </p>
            <button type="button" onClick={() => setModalOpen(true)} className={btnPrimary}>
              Add your first aircraft
            </button>
          </Card>
        )}
      </div>

      {atCap && (
        <p className="text-xs text-[#B45309]">
          Starter plan limit reached. Upgrade to Professional for unlimited tails.
        </p>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-aircraft-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md border border-[#3d3d3d] bg-[#0a0a0a] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#8d877e]">Fleet</p>
                <h2 id="add-aircraft-title" className="mt-1 text-xl font-semibold text-white">
                  Add aircraft
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-[#c8c2b8] hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={addAircraft} className="mt-4 space-y-3">
              <Field label="Tail number" hint="Looks up FAA registry cache on blur">
                <input
                  className={inputCls}
                  placeholder="N4867W"
                  value={tailNumber}
                  onChange={(e) => setTailNumber(e.target.value)}
                  onBlur={() => lookupTail(tailNumber)}
                  required
                  autoFocus
                  disabled={busy}
                />
              </Field>
              {lookingUp && (
                <p className="text-xs text-[#8d877e]">Looking up registry…</p>
              )}
              {lookupNote && !lookingUp && (
                <p className="text-xs text-[#c8c2b8]">{lookupNote}</p>
              )}
              {previewAds != null && previewAds > 0 && (
                <p className="text-xs text-[#B45309]">
                  {previewAds} open AD{previewAds === 1 ? "" : "s"} will be linked on save
                </p>
              )}

              {(needsManual || templates.length > 0) && (
                <Field label="Make / model template">
                  <select
                    className={inputCls}
                    value={templateKey}
                    onChange={(e) => applyTemplate(e.target.value)}
                    disabled={busy}
                  >
                    <option value="">Select a template (optional)</option>
                    {templates.map((t) => (
                      <option key={`${t.make}|${t.model}`} value={`${t.make}|${t.model}`}>
                        {t.make} {t.model}
                        {t.series ? ` · ${t.series}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Make">
                  <input
                    className={inputCls}
                    placeholder="Cessna"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    required
                    disabled={busy}
                  />
                </Field>
                <Field label="Model">
                  <input
                    className={inputCls}
                    placeholder="172S"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                    disabled={busy}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Year (optional)">
                  <input
                    className={inputCls}
                    type="number"
                    placeholder="2008"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={busy}
                  />
                </Field>
                <Field label="Serial (optional)">
                  <input
                    className={inputCls}
                    placeholder="14197"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    disabled={busy}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Engine (optional)">
                  <input
                    className={inputCls}
                    placeholder="Lycoming IO-540"
                    value={engineModel}
                    onChange={(e) => setEngineModel(e.target.value)}
                    disabled={busy}
                  />
                </Field>
                <Field label="Airframe hours (optional)">
                  <input
                    className={inputCls}
                    type="number"
                    step="0.1"
                    placeholder="3420.5"
                    value={airframeHours}
                    onChange={(e) => setAirframeHours(e.target.value)}
                    disabled={busy}
                  />
                </Field>
              </div>
              {err && <p className="text-xs text-[#FFE4E6]">{err}</p>}
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="submit" disabled={busy || lookingUp} className={btnPrimary}>
                  {busy ? "Adding…" : "Add to fleet"}
                </button>
                <button type="button" onClick={closeModal} className={btnSecondary}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
