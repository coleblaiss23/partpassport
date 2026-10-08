import Link from "next/link";
import { Badge } from "@/components/ui";

export type AircraftListItem = {
  id: string;
  tailNumber: string;
  make: string;
  model: string;
  year: number | null;
  airframeHours: number | null;
  openAds?: number;
};

export function AircraftCard({ aircraft }: { aircraft: AircraftListItem }) {
  return (
    <Link
      href={`/dashboard/fleet/${encodeURIComponent(aircraft.tailNumber)}`}
      className="block border border-[#2c2c2c] bg-[#111111] p-4 transition hover:border-[#c8c2b8]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="pp-track text-lg font-semibold text-white">{aircraft.tailNumber}</p>
          <p className="mt-0.5 text-sm text-[#c8c2b8]">
            {aircraft.make} {aircraft.model}
            {aircraft.year != null ? ` · ${aircraft.year}` : ""}
          </p>
        </div>
        {aircraft.openAds != null && aircraft.openAds > 0 ? (
          <Badge tone="amber">{aircraft.openAds} open AD{aircraft.openAds === 1 ? "" : "s"}</Badge>
        ) : (
          <Badge tone="green">Clear</Badge>
        )}
      </div>
      {aircraft.airframeHours != null && (
        <p className="mt-3 text-xs text-[#8d877e]">
          Airframe {aircraft.airframeHours.toLocaleString()} h
        </p>
      )}
    </Link>
  );
}
