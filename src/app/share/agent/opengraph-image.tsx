import { renderShareTease, shareTeaseSize } from "@/lib/og/shareTease";

export const dynamic = "force-static";
export const alt = "Someone randomized a Valorant agent for you";
export const size = shareTeaseSize;
export const contentType = "image/png";

export default function ShareAgentOGImage() {
  return renderShareTease({
    headline: "Someone randomized an agent for you",
    subline: "The pick stays hidden until you open the link.",
    plates: 1,
  });
}
