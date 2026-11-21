import {
  spritePositions,
  ICON_SPRITE,
  PORTRAIT_SPRITE,
} from "@/data/spriteMap";

type SpriteConfig = typeof ICON_SPRITE | typeof PORTRAIT_SPRITE;

interface SpriteIconProps {
  agentKey: string;
  type: "icon" | "portrait";
  className?: string;
  alt: string;
}

function getSpriteStyle(sprite: SpriteConfig, col: number, row: number) {
  const bgPctX = sprite.columns <= 1 ? 0 : (col / (sprite.columns - 1)) * 100;
  const bgPctY = sprite.rows <= 1 ? 0 : (row / (sprite.rows - 1)) * 100;

  return {
    backgroundImage: `url(${sprite.src})`,
    backgroundPosition: `${bgPctX}% ${bgPctY}%`,
    backgroundSize: `${sprite.columns * 100}% auto`,
    backgroundRepeat: "no-repeat",
  } as const;
}

export default function SpriteIcon({
  agentKey,
  type,
  className,
  alt,
}: SpriteIconProps) {
  const sprite = type === "icon" ? ICON_SPRITE : PORTRAIT_SPRITE;
  const pos = spritePositions[agentKey];
  if (!pos) return null;

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a slice of a sprite sheet, which <img> cannot show
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      // An empty alt marks the image as decoration, next to text that already
      // names it.
      aria-hidden={alt ? undefined : true}
      className={className}
      style={getSpriteStyle(sprite, pos.col, pos.row)}
    />
  );
}
