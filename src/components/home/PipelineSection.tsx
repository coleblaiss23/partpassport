"use client";

import { useEffect, useRef, useState } from "react";
import LandingCertPreview from "@/components/LandingCertPreview";

const CHAPTERS = [
  {
    title: "Deterministic OCR",
    detail:
      "Blocks 3–23 extracted and validated — missing fields, blank signatures, impossible dates. The intake plate is what receiving sees when a form clears.",
  },
  {
    title: "AVL enforcement",
    detail:
      "Block 4 issuer checked against your Approved Vendor List. A name that is not on the list does not get a soft warning. It fails.",
  },
  {
    title: "FAA UPN cross-reference",
    detail:
      "Part number matched against imported unapproved-parts notices and related flags before the serial is put away.",
  },
  {
    title: "Chain of custody",
    detail:
      "Inspections, repairs, and transfers are signed by the recording organization and linked in sequence. Tamper one event and verification fails at that point.",
  },
];

export default function PipelineSection() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const nodes = refs.current.filter((n): n is HTMLElement => n != null);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.index);
        if (!Number.isNaN(index)) setActive(index);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0.15, 0.4, 0.7] },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section className="border-t border-[#2c2c2c]">
      <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="order-2 lg:order-1">
          {CHAPTERS.map((chapter, i) => {
            const on = i === active;
            return (
              <article
                key={chapter.title}
                data-index={i}
                ref={(node) => {
                  refs.current[i] = node;
                }}
                className="flex min-h-[78vh] flex-col justify-center border-b border-[#2c2c2c] px-6 py-16 md:px-12 lg:px-16"
              >
                <p
                  className={`pp-track text-[11px] uppercase tracking-[0.32em] transition-colors ${
                    on ? "text-[#c4893a]" : "text-[#8d877e]"
                  }`}
                >
                  0{i + 1} / 04
                </p>
                <h2
                  className={`mt-5 max-w-xl text-4xl leading-[0.95] transition-colors sm:text-5xl md:text-6xl ${
                    on ? "text-[#f4f1ea]" : "text-[#3d3d3d]"
                  }`}
                >
                  {chapter.title}
                </h2>
                <p className="mt-6 max-w-md text-base leading-relaxed text-[#c8c2b8]">{chapter.detail}</p>
              </article>
            );
          })}
        </div>

        <div className="order-1 border-[#2c2c2c] lg:order-2 lg:border-l">
          <div className="px-6 py-10 lg:sticky lg:top-20 lg:px-10 lg:py-16">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <p className="pp-track text-[11px] uppercase tracking-[0.28em] text-[#8d877e]">
                Intake plate
              </p>
              <p className="pp-track text-[11px] text-[#c4893a]">0{active + 1}</p>
            </div>
            <div className="border border-[#3d3d3d] bg-[#0a0a0a]">
              <LandingCertPreview />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#8d877e]">
              FAA Form 8130-3 · blocks held as a data plate, not a dashboard card.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
