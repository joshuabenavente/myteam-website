// The myteam.fans wordmark and app icon, from the brand files. The lettering takes the text color
// (white on the dark headers); only the dot changes, through --team-dot (see applyTheme).

import { GLYPHS, LETTERS } from '../lib/brand.ts'

const DOT = 'var(--team-dot, #F04B32)'

/** "myteam.fans", about 6.2 times as wide as it is tall. */
export function Wordmark({ height = 28, className = '', decorative = false }: { height?: number; className?: string; decorative?: boolean }) {
  return (
    <svg
      className={`wordmark ${className}`}
      viewBox="25 28 751 122"
      height={height}
      width={(height * 751) / 122}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'myteam.fans'}
      aria-hidden={decorative || undefined}
    >
      <g fill="currentColor">
        {LETTERS.map(([c, x]) => (
          <path key={x} d={GLYPHS[c]} transform={`translate(${x} 123) scale(0.064 -0.064)`} />
        ))}
      </g>
      <circle cx="506.624" cy="111" r="9.5" fill={DOT} />
    </svg>
  )
}

/** The "m." app icon: on its dark tile, or a see-through one that takes the header's color. */
export function BrandIcon({ size = 32, label, glass = false, className = '' }: { size?: number; label?: string; glass?: boolean; className?: string }) {
  return (
    <svg
      className={`brand-icon ${className}`}
      viewBox="0 0 224 224"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect width="224" height="224" rx="48" fill={glass ? 'rgb(255 255 255 / 14%)' : '#101820'} />
      <path d={GLYPHS.m} transform="translate(33 158) scale(0.064 -0.064)" fill="#fff" />
      <circle cx="150.84" cy="146" r="13" fill={DOT} />
    </svg>
  )
}
