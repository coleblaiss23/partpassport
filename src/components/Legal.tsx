export type Section = { h: string; p: string[] };

export default function Legal({ title, updated, sections }: { title: string; updated: string; sections: Section[] }) {
 return (
 <main className="mx-auto max-w-3xl px-4 py-10">
 <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
 <p className="mt-1 text-sm text-[#7C8495]">Last updated {updated}</p>
 <div className="mt-8 space-y-7">
 {sections.map((s, i) => (
 <section key={s.h}>
 <h2 className="text-lg font-medium text-white">{i + 1}. {s.h}</h2>
 {s.p.map((t) => <p key={t} className="mt-2 text-sm leading-relaxed text-[#B0B6C3]">{t}</p>)}
 </section>
 ))}
 </div>
 </main>
 );
}
