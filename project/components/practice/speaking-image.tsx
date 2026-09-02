"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import { resolveSpeakingImageUrl } from "@/lib/speaking/image-availability";

export function SpeakingImageUnavailable({ label = "Hình ảnh đề bài" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label="IMAGE SOURCE UNAVAILABLE"
      data-testid="speaking-image-unavailable"
      className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center"
    >
      <ImageOff className="h-7 w-7 text-amber-300" aria-hidden="true" />
      <strong className="text-sm font-bold text-amber-200">IMAGE SOURCE UNAVAILABLE</strong>
      <span className="text-xs text-slate-400">
        {label} chưa có mapping nguồn được xác minh; không hiển thị ảnh đoán.
      </span>
    </div>
  );
}

export function SpeakingImage({ src, alt, label }: { src: unknown; alt: string; label?: string }) {
  const resolvedSrc = resolveSpeakingImageUrl(src);
  const [failed, setFailed] = React.useState(false);

  if (!resolvedSrc || failed) {
    return <SpeakingImageUnavailable label={label} />;
  }

  // The recovered composite crop for this source has a documented 12px
  // neighbour sliver on the left edge. Clip that boundary at render time so
  // learners never see another stimulus; the source bytes remain untouched.
  const trimLeft = resolvedSrc.includes("gdrive_spk_p3_036-b") ? 12 : 0;
  const trimRight = resolvedSrc.includes("gdrive_spk_p3_052-a") ? 128 : 0;
  return (
    <div className="overflow-hidden rounded-xl" style={trimLeft || trimRight ? { maxHeight: 360 } : undefined}>
      <img
        src={resolvedSrc}
        alt={alt}
        data-testid="speaking-image"
        data-image-src={resolvedSrc}
        className="h-auto max-h-[360px] w-full rounded-xl object-contain"
        style={trimLeft || trimRight ? { clipPath: `inset(0 ${trimRight}px 0 ${trimLeft}px)` } : undefined}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
