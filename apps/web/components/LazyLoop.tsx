"use client";

import { useEffect, useRef } from "react";

// A muted loop that shows its poster at once but only downloads and plays when it nears
// the screen — so pages with several loops don't fight over bandwidth on load.
export default function LazyLoop({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current!;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.src) v.src = src;
        v.play().catch(() => {});
      } else if (v.src) v.pause();
    }, { rootMargin: "400px 0px" });
    io.observe(v);
    return () => io.disconnect();
  }, [src]);

  return <video ref={ref} className={className} poster={poster} muted loop playsInline preload="none" aria-hidden="true" />;
}
