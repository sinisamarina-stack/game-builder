import type { Metadata } from "next";
import PlayLoader from "@/components/player/PlayLoader";

export const metadata: Metadata = {
  title: "Play · Game Builder",
};

export default function PlayPage() {
  return <PlayLoader />;
}
