/**
 * Renders every logo and icon size the site uses from the master artwork in
 * `images/logo/`.
 *
 * The outputs are committed, so this only needs re-running when a master logo
 * changes. Look at the results afterwards: small sizes (the 16px favicon in
 * particular) are worth checking by eye.
 *
 *   npm run generate-logos
 */
import fs from "node:fs/promises";
import path from "node:path";

import sharp, { type Sharp } from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const MASTERS = path.join(ROOT, "images", "logo");
const LOGO_DIR = path.join(ROOT, "public", "imgs", "logo");
const APP_DIR = path.join(ROOT, "src", "app");

/** Wide "AP" lettering: navbar, favicons, social cards. */
const WORDMARK = path.join(MASTERS, "valorant-ap-only.png");
/** "AP" with the V mark: square app icons, where there is room for it. */
const BADGE = path.join(MASTERS, "valorant-agent-picker.png");
/** Opaque background for app icons; matches the manifest background_color. */
const ICON_BACKGROUND = "#0f1923";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** Pixels at or below this alpha are treated as empty when cropping. */
const ALPHA_THRESHOLD = 25;

/**
 * Crops a master to its visible content. The masters carry wide transparent
 * margins and some near-invisible alpha noise, so sharp's own trim() (which
 * keys off the corner colour) is not reliable here.
 */
async function trimmed(file: string): Promise<Buffer> {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });

  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] > ALPHA_THRESHOLD) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) throw new Error(`${file} has no visible pixels`);

  return sharp(file)
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .png()
    .toBuffer();
}

/** Scales to the given height, keeping the aspect ratio. */
function byHeight(src: Buffer, height: number): Sharp {
  return sharp(src).resize({ height });
}

/** Fits inside a transparent square, centred. */
function square(src: Buffer, size: number): Sharp {
  return sharp(src).resize(size, size, {
    fit: "contain",
    background: TRANSPARENT,
  });
}

/**
 * Opaque square icon with the logo centred at `scale` of the width. iOS and
 * Android launchers fill transparency with their own colour, so these are
 * flattened onto the site background instead.
 */
async function appIcon(
  src: Buffer,
  size: number,
  scale: number,
): Promise<Sharp> {
  const inner = Math.round(size * scale);
  const logo = await sharp(src)
    .resize(inner, inner, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: ICON_BACKGROUND,
    },
  }).composite([{ input: logo, gravity: "center" }]);
}

/** Packs PNGs into a .ico container (PNG-in-ICO, supported everywhere). */
async function writeIco(file: string, pngs: Buffer[]): Promise<void> {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  const entries: Buffer[] = [];
  let offset = header.length + 16 * pngs.length;
  for (const png of pngs) {
    const { width, height } = await sharp(png).metadata();
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // no palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }

  await fs.writeFile(file, Buffer.concat([header, ...entries, ...pngs]));
}

async function favicon(src: Buffer): Promise<Buffer[]> {
  return Promise.all(
    [16, 32, 48].map((size) => {
      const img = square(src, size);
      // A touch of sharpening keeps the outline from going to mush at 16/32.
      return (size < 48 ? img.sharpen({ sigma: 0.5 }) : img)
        .png({ compressionLevel: 9 })
        .toBuffer();
    }),
  );
}

const png = (img: Sharp, file: string) =>
  img.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(file);

const webp = (img: Sharp, file: string) =>
  img.webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(file);

const wordmark = await trimmed(WORDMARK);
const badge = await trimmed(BADGE);

await fs.mkdir(LOGO_DIR, { recursive: true });

// Navbar logo: drawn 2em (32px) tall, rendered at 3x for high-DPI screens.
await webp(byHeight(wordmark, 96), path.join(LOGO_DIR, "ap-logo.webp"));
// Social cards: satori (next/og) cannot decode WebP, so this one is PNG.
await png(byHeight(wordmark, 240), path.join(LOGO_DIR, "ap-logo.png"));

const ico = await favicon(wordmark);
await writeIco(path.join(APP_DIR, "favicon.ico"), ico);
await png(square(wordmark, 192), path.join(APP_DIR, "icon.png"));

await png(
  await appIcon(badge, 180, 0.76),
  path.join(APP_DIR, "apple-icon.png"),
);
await png(await appIcon(badge, 192, 0.76), path.join(LOGO_DIR, "icon-192.png"));
await png(await appIcon(badge, 512, 0.76), path.join(LOGO_DIR, "icon-512.png"));
// Maskable icons get cropped to a circle by some launchers: keep the logo
// inside the central 80% safe zone, which its diagonal needs ~62% to fit.
await png(
  await appIcon(badge, 512, 0.62),
  path.join(LOGO_DIR, "icon-maskable-512.png"),
);

console.log("Wrote logos and icons from images/logo/");
