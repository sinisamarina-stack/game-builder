"use client";

import dynamic from "next/dynamic";

const PlayView = dynamic(() => import("./PlayView"), {
  ssr: false,
  loading: () => <div className="grid h-dvh place-items-center bg-zinc-950 text-zinc-400">Loading game…</div>,
});

export default function PlayLoader() {
  return <PlayView />;
}
