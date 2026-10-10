"use client";

import { useState } from "react";

// Admins can paste any image URL, so a plain <img> (not next/image, which needs every
// host allow-listed) with a graceful fallback if the URL is broken.
export function EventImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`grid place-items-center bg-gradient-to-br from-brand-100 to-brand-200 text-4xl ${className}`} aria-label={alt}>
        🎟️
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}
