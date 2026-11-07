import Image from "next/image";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "").slice(0, 2);
  return letters.toUpperCase();
}

const ALLOWED_LOGO_HOST = "media.api-sports.io";

function isAllowedLogo(src: string): boolean {
  try {
    return new URL(src).hostname === ALLOWED_LOGO_HOST;
  } catch {
    return false;
  }
}

export function TeamLogo({
  name,
  src,
  size = 24,
  className,
}: {
  name: string;
  src: string | null;
  size?: number;
  className?: string;
}) {
  if (src && isAllowedLogo(src)) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-heading font-semibold text-muted-foreground",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
    >
      <span className="truncate">{initials(name)}</span>
    </span>
  );
}
