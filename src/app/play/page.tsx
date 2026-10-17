import type { Metadata } from "next";
import { GameScreen } from "@/components/GameScreen";

export const metadata: Metadata = {
  title: "Jogar · Quiz Claude Code",
};

export default function PlayPage() {
  return <GameScreen />;
}
