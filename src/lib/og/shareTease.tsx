import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const shareTeaseSize = { width: 1200, height: 630 };

interface ShareTeaseOptions {
  headline: string;
  subline: string;
  /** How many mystery plates to draw: one for an agent, a row for a squad. */
  plates: number;
}

function Plate({ width, height }: { width: number; height: number }) {
  return (
    <div
      style={{
        display: "flex",
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "#1a2332",
        border: "2px solid rgba(255, 70, 85, 0.45)",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Tungsten Bold",
        fontSize: `${Math.round(height * 0.5)}px`,
        color: "rgba(255, 70, 85, 0.8)",
      }}
    >
      ?
    </div>
  );
}

/**
 * Link preview for the share pages. The whole point of a share link is that the
 * agent stays hidden until it is opened, so the card teases rather than reveals.
 */
export async function renderShareTease({
  headline,
  subline,
  plates,
}: ShareTeaseOptions) {
  const ogFontsDir = join(process.cwd(), "src", "assets", "fonts");
  const [tungstenBold, dinNext] = await Promise.all([
    readFile(join(ogFontsDir, "Tungsten-Bold.ttf")),
    readFile(join(ogFontsDir, "DINNextW1G-Regular.ttf")),
  ]);

  const plateWidth = plates === 1 ? 260 : 90;
  const plateHeight = plates === 1 ? 260 : 130;
  const plateGap = 12;
  // Keep the plate row inside the 1200px card: 60px padding on either side.
  const textWidth =
    1200 - 120 - (plates * plateWidth + (plates - 1) * plateGap) - 40;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#0f1923",
        padding: "60px",
        position: "relative",
      }}
    >
      {/* Vertical red accent bar */}
      <div
        style={{
          position: "absolute",
          left: "44px",
          top: "60px",
          bottom: "70px",
          width: "4px",
          backgroundColor: "#ff4655",
          display: "flex",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginLeft: "20px",
          width: `${textWidth}px`,
        }}
      >
        <div
          style={{
            fontFamily: "DIN Next",
            fontSize: "22px",
            color: "#7f8c8d",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Valorant Agent Picker
        </div>
        <div
          style={{
            fontFamily: "Tungsten Bold",
            fontSize: "64px",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "2px",
            lineHeight: 1.05,
            marginTop: "14px",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontFamily: "DIN Next",
            fontSize: "24px",
            color: "#ece8e1",
            marginTop: "18px",
            lineHeight: 1.5,
          }}
        >
          {subline}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "32px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ff4655",
              color: "#ffffff",
              fontFamily: "Tungsten Bold",
              fontSize: "32px",
              padding: "10px 40px",
              textTransform: "uppercase",
              letterSpacing: "2px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Open to reveal →
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: `${plateGap}px`,
          marginLeft: "auto",
          alignItems: "center",
        }}
      >
        {Array.from({ length: plates }, (_, i) => (
          <Plate key={i} width={plateWidth} height={plateHeight} />
        ))}
      </div>

      {/* Bottom border accent */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          height: "4px",
          backgroundColor: "#ff4655",
          display: "flex",
        }}
      />
    </div>,
    {
      ...shareTeaseSize,
      fonts: [
        {
          name: "Tungsten Bold",
          data: tungstenBold,
          style: "normal",
          weight: 700,
        },
        {
          name: "DIN Next",
          data: dinNext,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
