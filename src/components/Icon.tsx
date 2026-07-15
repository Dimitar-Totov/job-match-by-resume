import { cn } from '../utils/cn';

interface IconProps {
  name: string;
  /** Optical size in px; also drives the visual glyph size. */
  size?: number;
  filled?: boolean;
  weight?: number;
  className?: string;
  spin?: boolean;
  color?: string;
}

/**
 * Renders a Material Symbols Rounded glyph. The font is loaded globally via a
 * <link> in index.html. Icons are decorative here; give interactive parents an
 * accessible name instead of labelling the glyph.
 */
export function Icon({
  name,
  size = 24,
  filled = false,
  weight = 400,
  className,
  spin = false,
  color,
}: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('material-symbols-rounded', spin && 'icon--spin', className)}
      style={{
        fontSize: size,
        color,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
      }}
    >
      {name}
    </span>
  );
}
