'use client';

import { NUMBER_SVGS, Num0 } from './NumberSvg';

interface Props {
  /** Integer value to display */
  value: number;
  /** How many digit slots to show (zero-padded on the left) */
  digits: number;
  /** Height of each digit in px */
  digitHeight?: number;
  /** Gap between digits in px */
  gap?: number;
}

/**
 * Renders a fixed-width pixel-segment number display using the design-asset SVGs.
 * e.g. value=5, digits=4 → "0005"
 */
export default function PixelDisplay({ value, digits, digitHeight = 22, gap = 4 }: Props) {
  const clamped = Math.max(0, Math.min(value, Math.pow(10, digits) - 1));
  const padded = String(clamped).padStart(digits, '0');

  return (
    <div className="flex items-center" style={{ gap }}>
      {padded.split('').map((ch, i) => {
        const n = parseInt(ch, 10);
        const Svg = NUMBER_SVGS[n] ?? Num0;
        return (
          <Svg
            key={i}
            style={{ height: digitHeight, width: 'auto' }}
          />
        );
      })}
    </div>
  );
}
