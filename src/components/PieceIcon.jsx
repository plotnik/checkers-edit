import { useId } from 'react';

const PALETTES = {
  black: {
    base: '#2c2c2c',
    top: '#1a1a1a',
    side: '#404040',
    highlight: '#555555',
    shadow: '#000000',
  },
  white: {
    base: '#f5f5f5',
    top: '#ffffff',
    side: '#e0e0e0',
    highlight: '#ffffff',
    shadow: '#cccccc',
  },
};

const PieceIcon = ({ color = 'black', isKing = false }) => {
  const id = useId().replace(/:/g, '');
  const palette = PALETTES[color] ?? PALETTES.black;
  const cylinders = isKing ? [17, 24] : [21];

  return (
    <svg
      className="piece-svg"
      viewBox="0 0 48 40"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-side`} x1="0" x2="1">
          <stop offset="0" stopColor={palette.shadow} />
          <stop offset="0.3" stopColor={palette.side} />
          <stop offset="0.5" stopColor={palette.highlight} />
          <stop offset="0.7" stopColor={palette.side} />
          <stop offset="1" stopColor={palette.shadow} />
        </linearGradient>
        <radialGradient id={`${id}-top`} cx="35%" cy="35%" r="70%">
          <stop offset="0" stopColor={palette.highlight} />
          <stop offset="0.5" stopColor={palette.top} />
          <stop offset="1" stopColor={palette.base} />
        </radialGradient>
      </defs>

      {cylinders.map((y) => (
        <g key={y}>
          <path
            d={`M7 ${y} L7 ${y + 6} A17 5 0 0 0 41 ${y + 6} L41 ${y} Z`}
            fill={`url(#${id}-side)`}
            stroke={palette.shadow}
          />
          <ellipse
            cx="24"
            cy={y}
            rx="17"
            ry="5"
            fill={`url(#${id}-top)`}
            stroke={palette.shadow}
          />
        </g>
      ))}

      {isKing && (
        <path
          d="M15 17 L15 12 L19.5 15 L24 9 L28.5 15 L33 12 L33 17 Z"
          fill="#ffd700"
          stroke="#b8860b"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

export default PieceIcon;
