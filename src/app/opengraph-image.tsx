import { ImageResponse } from "next/og";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const publicDir = join(process.cwd(), "public");
  const ogFontsDir = join(process.cwd(), "src", "assets", "fonts");
  const iconsDir = join(publicDir, "imgs", "agents", "icons");

  const iconFiles = (await readdir(iconsDir))
    .filter((f) => f.endsWith(".png"))
    .sort();

  const [tungstenBold, dinNext, ...iconBuffers] = await Promise.all([
    readFile(join(ogFontsDir, "Tungsten-Bold.ttf")),
    readFile(join(ogFontsDir, "DINNextW1G-Regular.ttf")),
    ...iconFiles.map((f) => readFile(join(iconsDir, f))),
  ]);

  const iconDataUrls = iconBuffers.map(
    (buf) => `data:image/png;base64,${buf.toString("base64")}`
  );

  const ICON_SIZE = 52;
  const ICON_GAP = 6;
  const COLS = 7;

  return new ImageResponse(
    (
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

        {/* Left: text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "20px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {/* Headline */}
          <div
            style={{
              fontFamily: "Tungsten Bold",
              fontSize: "88px",
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "2px",
              lineHeight: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>VALORANT</span>
            <span>AGENT PICKER</span>
          </div>

          {/* Subtext */}
          <div
            style={{
              fontFamily: "DIN Next",
              fontSize: "24px",
              color: "#ece8e1",
              marginTop: "24px",
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.5,
            }}
          >
            <span>Get a random agent for you.</span>
            <span>Randomize a team of agents for your squad.</span>
          </div>

          {/* CTA button */}
          <div
            style={{
              display: "flex",
              marginTop: "40px",
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
              PICK YOUR AGENT
            </div>
          </div>
        </div>

        {/* Right: agent icons grid */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: `${ICON_GAP}px`,
            marginLeft: "40px",
          }}
        >
          {Array.from(
            { length: Math.ceil(iconDataUrls.length / COLS) },
            (_, rowIdx) => {
              const rowIcons = iconDataUrls.slice(
                rowIdx * COLS,
                rowIdx * COLS + COLS
              );
              return (
                <div
                  key={rowIdx}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: `${ICON_GAP}px`,
                  }}
                >
                  {rowIcons.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      width={ICON_SIZE}
                      height={ICON_SIZE}
                      style={{ display: "flex" }}
                      alt=""
                    />
                  ))}
                </div>
              );
            }
          )}
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
      </div>
    ),
    {
      ...size,
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
    }
  );
}
