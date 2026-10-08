import { Badge, Card } from "@/components/ui";
import type { AdStatusRow } from "./ActiveADsTab";

export function ComplianceHistoryTab({ items }: { items: AdStatusRow[] }) {
  const history = items.filter(
    (i) => i.status === "COMPLIED" || i.status === "NOT_APPLICABLE",
  );

  if (history.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[#c8c2b8]">No complied or N/A AD records yet.</p>
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
            <th className="pb-2 font-medium">Complied</th>
            <th className="pb-2 font-medium">Sign-off</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.id} className="border-t border-[#2c2c2c]">
              <td className="py-2 pr-3">
                <p className="pp-track font-medium text-white">{row.safetyFlag.referenceId}</p>
                <p className="text-xs text-[#8d877e] line-clamp-2">{row.safetyFlag.description}</p>
              </td>
              <td className="py-2 pr-3">
                <Badge tone={row.status === "COMPLIED" ? "green" : "slate"}>
                  {row.status.replace("_", " ")}
                </Badge>
              </td>
              <td className="pp-track py-2 pr-3 text-[#c8c2b8]">
                {row.compliedAt ? new Date(row.compliedAt).toLocaleDateString() : "—"}
              </td>
              <td className="py-2 text-[#c8c2b8]">{row.signedOffByName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
