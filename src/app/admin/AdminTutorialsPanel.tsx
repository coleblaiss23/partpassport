"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, Field, btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import { TUTORIAL_CATEGORIES, categoryLabel } from "@/lib/tutorials";

type Video = {
  id: string;
  title: string;
  description: string | null;
  embedUrl: string;
  category: string;
  sortOrder: number;
  published: boolean;
  duration: string | null;
};

const empty = {
  title: "",
  description: "",
  embedUrl: "",
  category: "GENERAL",
  duration: "",
  sortOrder: "100",
  published: true,
};

export function AdminTutorialsPanel() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/tutorials");
    if (!r.ok) throw new Error("Failed to load tutorials");
    const j = await r.json();
    setVideos(j.videos ?? []);
  }, []);

  useEffect(() => {
    load().catch((e) => setErr((e as Error).message));
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        embedUrl: form.embedUrl,
        category: form.category,
        duration: form.duration || undefined,
        sortOrder: Number(form.sortOrder) || 100,
        published: form.published,
      };
      const r = await fetch(
        editing ? `/api/admin/tutorials/${editing}` : "/api/admin/tutorials",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setForm(empty);
      setEditing(null);
      await load();
    } catch (ex) {
      setErr((ex as Error).message);
    }
    setBusy(false);
  }

  function startEdit(v: Video) {
    setEditing(v.id);
    setForm({
      title: v.title,
      description: v.description ?? "",
      embedUrl: v.embedUrl,
      category: v.category,
      duration: v.duration ?? "",
      sortOrder: String(v.sortOrder),
      published: v.published,
    });
  }

  async function togglePublished(v: Video) {
    await fetch(`/api/admin/tutorials/${v.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ published: !v.published }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this tutorial video?")) return;
    await fetch(`/api/admin/tutorials/${id}`, { method: "DELETE" });
    if (editing === id) {
      setEditing(null);
      setForm(empty);
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-white">
            {editing ? "Edit tutorial video" : "Add tutorial video"}
          </h2>
          <a href="/tutorials" className="text-xs text-[#1F6B47] hover:underline" target="_blank" rel="noreferrer">
            Open public Tutorials →
          </a>
        </div>
        <p className="text-sm text-[#B0B6C3]">
          Embed YouTube, Vimeo, or a direct MP4 URL. Seed cards for AVL bulk import, 8130-3 intake,
          and audit sharing ship empty — paste your walkthrough links here.
        </p>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input
              required
              className={inputCls}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="AVL bulk import walkthrough"
            />
          </Field>
          <Field label="Category">
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {TUTORIAL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Embed / watch URL" hint="YouTube, Vimeo, or .mp4">
            <input
              className={`${inputCls} pp-track`}
              value={form.embedUrl}
              onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </Field>
          <Field label="Duration (optional)">
            <input
              className={inputCls}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="5:00"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                className={`${inputCls} min-h-[72px]`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What receiving inspectors will learn…"
              />
            </Field>
          </div>
          <Field label="Sort order">
            <input
              type="number"
              className={inputCls}
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-white">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published on /tutorials
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy ? "Saving…" : editing ? "Update video" : "Add video"}
            </button>
            {editing && (
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setEditing(null);
                  setForm(empty);
                }}
              >
                Cancel edit
              </button>
            )}
            {err && <p className="self-center text-sm text-[#FFE4E6]">{err}</p>}
          </div>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium text-white">
          Library <span className="text-[#7C8495]">({videos.length})</span>
        </h2>
        {videos.length === 0 ? (
          <p className="text-sm text-[#B0B6C3]">No videos yet.</p>
        ) : (
          <ul className="divide-y divide-[#1F2430]">
            {videos.map((v) => (
              <li key={v.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">{v.title}</span>
                    <Badge tone="slate">{categoryLabel(v.category)}</Badge>
                    <Badge tone={v.published ? "green" : "amber"}>
                      {v.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {v.description && (
                    <p className="text-sm text-[#B0B6C3]">{v.description}</p>
                  )}
                  <p className="pp-track truncate text-xs text-[#7C8495]">
                    {v.embedUrl || "(no embed URL)"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnSecondary} onClick={() => startEdit(v)}>
                    Edit
                  </button>
                  <button type="button" className={btnSecondary} onClick={() => togglePublished(v)}>
                    {v.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    className="rounded-[4px] border border-[#9F1239] px-3 py-2 text-sm text-[#FFE4E6]"
                    onClick={() => remove(v.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
