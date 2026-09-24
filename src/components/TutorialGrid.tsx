"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui";
import { toEmbedSrc, categoryLabel } from "@/lib/tutorials";

export type TutorialCard = {
  id: string;
  title: string;
  description: string | null;
  embedUrl: string;
  category: string;
  duration: string | null;
};

export function TutorialGrid({ videos }: { videos: TutorialCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {videos.map((v) => (
        <TutorialVideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}

export function TutorialVideoCard({ video }: { video: TutorialCard }) {
  const src = toEmbedSrc(video.embedUrl);
  const [open, setOpen] = useState(false);

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <div className="relative aspect-video bg-[#0B0F14]">
        {src && open ? (
          <iframe
            title={video.title}
            src={src}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => src && setOpen(true)}
            disabled={!src}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#12151C] text-center disabled:cursor-default"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[4px] border border-[#222A3B] bg-[#0B0F14] text-white">
              ▶
            </span>
            <span className="px-4 text-xs text-[#7C8495]">
              {src ? "Play tutorial" : "Embed URL not configured yet"}
            </span>
          </button>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="slate">{categoryLabel(video.category)}</Badge>
          {video.duration ? (
            <span className="pp-track text-[10px] text-[#7C8495]">{video.duration}</span>
          ) : null}
        </div>
        <h3 className="text-sm font-semibold text-white">{video.title}</h3>
        {video.description ? (
          <p className="text-sm leading-relaxed text-[#B0B6C3]">{video.description}</p>
        ) : null}
      </div>
    </Card>
  );
}
