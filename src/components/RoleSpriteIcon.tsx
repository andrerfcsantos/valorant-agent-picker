import { ROLE_SPRITE, roleSpritePositions } from "@/data/spriteMap";

interface RoleSpriteIconProps {
  roleKey: string;
  className?: string;
  alt: string;
}

export default function RoleSpriteIcon({ roleKey, className, alt }: RoleSpriteIconProps) {
  const col = roleSpritePositions[roleKey.toLowerCase()];
  if (col === undefined) return null;

  const bgPctX = ROLE_SPRITE.columns <= 1 ? 0 : (col / (ROLE_SPRITE.columns - 1)) * 100;

  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      style={{
        backgroundImage: `url(${ROLE_SPRITE.src})`,
        backgroundPosition: `${bgPctX}% 0%`,
        backgroundSize: `${ROLE_SPRITE.columns * 100}% auto`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
