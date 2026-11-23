"use client";

import dynamic from "next/dynamic";

// The builder relies on WebGL and localStorage, so it renders on the client only.
const Builder = dynamic(() => import("./Builder"), {
  ssr: false,
  loading: () => <div className="grid h-dvh place-items-center bg-zinc-950 text-zinc-400">Loading builder…</div>,
});

export default function BuilderLoader() {
  return <Builder />;
}
