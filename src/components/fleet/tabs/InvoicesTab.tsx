import { Badge, Card } from "@/components/ui";

export type InvoiceRow = {
  id: string;
  number: string;
  amountCents: number;
  currency: string;
  paymentStatus: "PENDING" | "PAID" | "CHECK_RECEIVED" | "VOID";
  createdAt: string;
  paidAt: string | null;
};

const TONE: Record<InvoiceRow["paymentStatus"], "amber" | "green" | "slate" | "red"> = {
  PENDING: "amber",
  PAID: "green",
  CHECK_RECEIVED: "green",
  VOID: "slate",
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function InvoicesTab({ items }: { items: InvoiceRow[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[#c8c2b8]">
          No invoices linked to this aircraft. Work-order invoices will appear here once created.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-[#8d877e]">
          <tr>
            <th className="pb-2 font-medium">Invoice</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-[#2c2c2c]">
              <td className="pp-track py-2 pr-3 font-medium text-white">{row.number}</td>
              <td className="pp-track py-2 pr-3 text-[#c8c2b8]">
                {money(row.amountCents, row.currency)}
              </td>
              <td className="py-2 pr-3">
                <Badge tone={TONE[row.paymentStatus]}>
                  {row.paymentStatus.replace("_", " ")}
                </Badge>
              </td>
              <td className="pp-track py-2 text-[#c8c2b8]">
                {new Date(row.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
