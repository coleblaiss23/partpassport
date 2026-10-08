import { Badge, Card } from "@/components/ui";

export type LlpRow = {
  id: string;
  name: string;
  category: string;
  limitBasis: "CALENDAR" | "HOURS" | "CYCLES";
  dueAt: string | null;
  currentHours: number | null;
  currentCycles: number | null;
  intervalHours: number | null;
  intervalDays: number | null;
  lastCompliedAt: string | null;
};

function overdue(row: LlpRow): boolean {
  if (row.dueAt && new Date(row.dueAt) < new Date()) return true;
  return false;
}

export function LifeLimitedTab({ items }: { items: LlpRow[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[#c8c2b8]">
          No life-limited components tracked on this airframe yet. Add BRS repacks, hoses,
          magnetos, or hour-based overhauls from uploads or manually.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-[#8d877e]">
          <tr>
            <th className="pb-2 font-medium">Component</th>
            <th className="pb-2 font-medium">Basis</th>
            <th className="pb-2 font-medium">Due / remaining</th>
            <th className="pb-2 font-medium">Last complied</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-[#2c2c2c]">
              <td className="py-2 pr-3">
                <p className="font-medium text-white">{row.name}</p>
                <p className="text-xs text-[#8d877e]">{row.category}</p>
              </td>
              <td className="py-2 pr-3">
                <Badge tone={overdue(row) ? "red" : "slate"}>{row.limitBasis}</Badge>
              </td>
              <td className="pp-track py-2 pr-3 text-[#c8c2b8]">
                {row.dueAt
                  ? new Date(row.dueAt).toLocaleDateString()
                  : row.intervalHours != null && row.currentHours != null
                    ? `${Math.max(0, row.intervalHours - row.currentHours).toFixed(1)} h rem`
                    : "—"}
              </td>
              <td className="pp-track py-2 text-[#c8c2b8]">
                {row.lastCompliedAt ? new Date(row.lastCompliedAt).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
