/** Normalize YouTube / Vimeo / direct URLs into an iframe-safe embed src. */
export function toEmbedSrc(raw: string | null | undefined): string | null {
  const url = (raw ?? "").trim();
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube.com${u.pathname}${u.search}`;
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("shorts");
      if (idx >= 0 && parts[idx + 1]) return `https://www.youtube.com/embed/${parts[idx + 1]}`;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com") return url;

    // Direct MP4 / already-embeddable
    if (/\.(mp4|webm)(\?|$)/i.test(u.pathname) || u.pathname.includes("/embed")) return url;
    return url;
  } catch {
    return null;
  }
}

export const TUTORIAL_CATEGORIES = [
  { id: "AVL", label: "AVL & vendors" },
  { id: "INTAKE", label: "Certificate intake" },
  { id: "AUDIT_SHARE", label: "Audit sharing" },
  { id: "GENERAL", label: "General" },
] as const;

export type TutorialCategory = (typeof TUTORIAL_CATEGORIES)[number]["id"];

export function categoryLabel(id: string) {
  return TUTORIAL_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
