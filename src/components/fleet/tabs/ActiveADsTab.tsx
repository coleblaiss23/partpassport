import { Badge, Card } from "@/components/ui";

export type AdStatusRow = {
  id: string;
  status: "OPEN" | "COMPLIED" | "NOT_APPLICABLE" | "OVERDUE";
  dueAt: string | null;
  compliedAt: string | null;
  signedOffByName: string | null;
  notes: string | null;
  safetyFlag: {
    referenceId: string;
    description: string;
    source: string;
    url: string | null;
  };
};

const TONE: Record<AdStatusRow["status"], "amber" | "green" | "slate" | "red"> = {
  OPEN: "amber",
  OVERDUE: "red",
  COMPLIED: "green",
  NOT_APPLICABLE: "slate",
};

export function ActiveADsTab({ items }: { items: AdStatusRow[] }) {
  const active = items.filter(
    (i) => i.status === "OPEN" || i.status === "OVERDUE" || i.status === "COMPLIED",
  );

  if (active.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[#c8c2b8]">
          No AD statuses linked to this tail yet. Open and complied items will appear here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-[#8d877e]">
          <tr>
            <th className="pb-2 font-medium">Reference</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Due / complied</th>
            <th className="pb-2 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {active.map((row) => (
            <tr key={row.id} className="border-t border-[#2c2c2c]">
              <td className="py-2 pr-3">
                <p className="pp-track font-medium text-white">{row.safetyFlag.referenceId}</p>
                <p className="text-xs text-[#8d877e] line-clamp-2">{row.safetyFlag.description}</p>
              </td>
              <td className="py-2 pr-3">
                <Badge tone={TONE[row.status]}>{row.status.replace("_", " ")}</Badge>
              </td>
              <td className="pp-track py-2 pr-3 text-[#c8c2b8]">
                {row.status === "COMPLIED" && row.compliedAt
                  ? new Date(row.compliedAt).toLocaleDateString()
                  : row.dueAt
                    ? new Date(row.dueAt).toLocaleDateString()
                    : "—"}
              </td>
              <td className="py-2 text-[#c8c2b8]">{row.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
