import Link from "next/link";
import PartSearch from "@/components/PartSearch";
import SchematicField from "@/components/home/SchematicField";
import PipelineSection from "@/components/home/PipelineSection";
import { btnPrimary, btnSecondary } from "@/components/ui";

const FLOOR = [
  {
    k: "01",
    t: "Receiving inspection",
    d: "Run the PDF on arrival. Catch AVL failures and missing blocks before put-away.",
  },
  {
    k: "02",
    t: "Traders and distributors",
    d: "Put a public verify link on the quote so the buyer can open the custody ledger without another email thread.",
  },
  {
    k: "03",
    t: "Repair station quality",
    d: "Generate a 14 CFR 43.9 return-to-service draft from a verified certificate, and block installation of expired life-limited assemblies.",
  },
];

export default function Home() {
  return (
    <main className="bg-[#0a0a0a]">
      <section className="relative min-h-[100svh] overflow-hidden border-b border-[#2c2c2c]">
        <div className="absolute inset-0">
          <SchematicField />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.15)_0%,rgba(10,10,10,0.35)_38%,#0a0a0a_68%)] lg:bg-[linear-gradient(90deg,#0a0a0a_0%,rgba(10,10,10,0.94)_30%,rgba(10,10,10,0.28)_46%,transparent_68%)]" />

        <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-6 pb-12 pt-28 md:px-12 lg:max-w-3xl lg:justify-center lg:pb-0">
          <p className="pp-track text-[11px] uppercase tracking-[0.34em] text-[#c4893a]">
            Registry  ·  Form 8130-3  ·  Form 1
          </p>
          <h1 className="mt-6 max-w-3xl text-[clamp(3.1rem,7.4vw,6.6rem)] leading-[0.9] text-[#f4f1ea]">
            Release certificate control before the part hits the <em>shelf.</em>
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-[#c8c2b8] md:text-lg">
            Deterministic OCR on 8130-3 / Form 1. AVL enforcement. FAA UPN cross-reference.
            Signed custody ledger per serial.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/request-access" className={btnPrimary}>
              Request pilot access
            </Link>
            <Link href="/sample-report" className={btnSecondary}>
              Sample report
            </Link>
          </div>
          <p className="mt-6 text-xs text-[#8d877e]">
            Not an airworthiness determination. For MROs and repair stations.
          </p>
        </div>

        <div className="absolute bottom-8 right-6 z-10 hidden text-right md:block md:right-12">
          <p className="pp-track text-[11px] uppercase tracking-[0.28em] text-[#c8c2b8]">Three-blade propeller</p>
          <p className="pp-track mt-1 text-[11px] tracking-[0.18em] text-[#8d877e]">
            Turns with the page
          </p>
        </div>
      </section>

      <PipelineSection />

      <section className="border-b border-[#2c2c2c]">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border-b border-[#2c2c2c] px-6 py-16 md:px-12 lg:border-b-0 lg:border-r lg:px-16">
            <p className="pp-track text-[11px] uppercase tracking-[0.32em] text-[#c4893a]">Public registry</p>
            <h2 className="mt-4 text-4xl leading-[0.95] text-[#f4f1ea] sm:text-5xl">
              Look up a serialized part.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#c8c2b8]">
              The verify link is the record. Open a demo ledger, or run a part number and serial
              against the public chain.
            </p>
          </div>
          <div className="px-6 py-16 md:px-12 lg:px-16">
            <PartSearch />
            <p className="mt-8 text-sm text-[#8d877e]">
              <Link href="/sample-part" className="text-[#f4f1ea] underline decoration-[#3d3d3d] underline-offset-4 hover:decoration-[#c4893a]">
                Sample custody ledger
              </Link>
              <span className="px-3 text-[#3d3d3d]">/</span>
              <Link href="/sample-report" className="text-[#f4f1ea] underline decoration-[#3d3d3d] underline-offset-4 hover:decoration-[#c4893a]">
                Sample 8130-3 report
              </Link>
              <span className="px-3 text-[#3d3d3d]">/</span>
              <Link href="/sample-part?tamper=1" className="text-[#f4f1ea] underline decoration-[#3d3d3d] underline-offset-4 hover:decoration-[#c4893a]">
                Broken chain
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#2c2c2c]">
        <div className="px-6 py-16 md:px-12 lg:px-16">
          <p className="pp-track text-[11px] uppercase tracking-[0.32em] text-[#8d877e]">Built for the hangar floor</p>
          <div className="mt-10 grid border border-[#2c2c2c] md:grid-cols-3">
            {FLOOR.map((item, i) => (
              <div
                key={item.k}
                className={`px-6 py-8 ${i > 0 ? "border-t border-[#2c2c2c] md:border-l md:border-t-0" : ""}`}
              >
                <p className="pp-track text-[11px] tracking-[0.22em] text-[#c4893a]">{item.k}</p>
                <h2 className="mt-4 text-3xl text-[#f4f1ea]">{item.t}</h2>
                <p className="mt-4 text-sm leading-relaxed text-[#c8c2b8]">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="metal-hairline" />
        <div className="flex min-h-[70vh] flex-col justify-between px-6 py-16 md:px-12 lg:px-16">
          <p className="pp-track text-[11px] uppercase tracking-[0.32em] text-[#c4893a]">Access</p>
          <div className="max-w-4xl">
            <h2 className="text-[clamp(3rem,8vw,7rem)] leading-[0.88] text-[#f4f1ea]">
              Plans from $299<span className="text-[#8d877e]">/mo.</span>
            </h2>
            <p className="mt-6 max-w-md text-base text-[#c8c2b8]">
              A 14-day trial starts when the organization is created. The ledger does not certify airworthiness.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/request-access" className={btnPrimary}>
                Request access
              </Link>
              <Link href="/pricing" className={btnSecondary}>
                Pricing
              </Link>
            </div>
          </div>
          <p className="pp-track pt-16 text-[11px] uppercase tracking-[0.28em] text-[#8d877e]">
            PartPassport  ·  custody per serial
          </p>
        </div>
      </section>
    </main>
  );
}
