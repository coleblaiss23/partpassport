import { Card, Stat } from "@/components/ui";

export type AircraftOverview = {
  id: string;
  tailNumber: string;
  make: string;
  model: string;
  year: number | null;
  series: string | null;
  serialNumber: string | null;
  engineModel: string | null;
  airframeHours: number | null;
  hobbsHours: number | null;
  openAds: number;
  overdueLlp: number;
  pendingInvoices: number;
};

export function OverviewTab({ aircraft }: { aircraft: AircraftOverview }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Open ADs" value={String(aircraft.openAds)} />
        <Stat label="Overdue LLP" value={String(aircraft.overdueLlp)} />
        <Stat label="Pending invoices" value={String(aircraft.pendingInvoices)} />
      </div>
      <Card>
        <h3 className="text-sm font-medium text-white">Identity</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[#8d877e]">Make / Model</dt>
            <dd className="text-white">
              {aircraft.make} {aircraft.model}
              {aircraft.series ? ` ${aircraft.series}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-[#8d877e]">Year</dt>
            <dd className="text-white">{aircraft.year ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#8d877e]">Serial</dt>
            <dd className="pp-track text-white">{aircraft.serialNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#8d877e]">Engine</dt>
            <dd className="text-white">{aircraft.engineModel ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#8d877e]">Airframe hours</dt>
            <dd className="pp-track text-white">
              {aircraft.airframeHours != null ? aircraft.airframeHours.toLocaleString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#8d877e]">Hobbs</dt>
            <dd className="pp-track text-white">
              {aircraft.hobbsHours != null ? aircraft.hobbsHours.toLocaleString() : "—"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
