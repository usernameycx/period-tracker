import React from 'react';
import Svg, { Path, Circle, Line, Rect, G, Polyline } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export type IconName =
  | 'today'      // Mini Tidal Moon — circle with wave
  | 'calendar'   // Calendar grid
  | 'settings'   // Three sliders
  | 'cycle'      // Circular arrows (cycle)
  | 'weather'    // Sun
  | 'stats'      // Trend line chart
  | 'bell'       // Reminder bell
  | 'drop'       // Period teardrop
  | 'clipboard'  // Symptom record
  | 'warning'    // Reset/exclamation triangle
  | 'backup'     // Database/disk
  | 'export'     // Arrow up-right
  | 'import'     // Arrow down-left
  | 'info'       // Info circle
  | 'diet'       // Bowl/fork
  | 'check'      // Checkmark
  | 'chevron'    // Right chevron
  | 'sun'        // Sun with rays (weather)
  | 'sparkle'    // Sparkle for advice/highlight
  | 'bulb'       // Lightbulb for tips
  | 'blood'      // Blood drop for period indicator
  | 'egg'        // Egg cell for ovulation
  | 'dot'        // Filled circle for status indicator
  | 'leaf'        // Leaf for follicular / growth phase
  | 'close'        // X mark for inappropriate/avoid
  | 'chevron-down'  // Down chevron
  | 'lightning'    // Bolt for energy
  | 'battery'     // Battery for energy/normal
  | 'location'    // Map pin for city/location
  | 'edit'        // Pencil/edit
  | 'moon';       // Crescent moon for evening

// Ellipse helper — SVG <ellipse> with center coordinates
function Ellipse2({ cx, cy, rx, ry, ...rest }: { cx: number; cy: number; rx: number; ry: number; [key: string]: any }) {
  return (
    <Path
      d={`M ${cx - rx},${cy} A ${rx},${ry} 0 1,1 ${cx + rx},${cy} A ${rx},${ry} 0 1,1 ${cx - rx},${cy}`}
      {...rest}
    />
  );
}

const PATHS: Record<IconName, (color: string) => React.ReactElement> = {
  // ── Tab Bar ─────────────────────────────────────────────
  today: (c) => (
    <G>
      {/* Outer ring */}
      <Circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Wave through center */}
      <Path
        d="M 4,12 C 6,9 8,15 10,12 C 12,9 14,15 16,12 C 18,9 20,15 20,12"
        fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round"
      />
      {/* Small crescent dot */}
      <Circle cx="16" cy="7.5" r="1.5" fill={c} />
    </G>
  ),

  calendar: (c) => (
    <G>
      {/* Calendar frame */}
      <Rect x="3" y="4" width="18" height="17" rx="3" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Top bar */}
      <Line x1="3" y1="9" x2="21" y2="9" stroke={c} strokeWidth="1.2" />
      {/* Grid dots for dates */}
      <Circle cx="7" cy="13" r="1" fill={c} />
      <Circle cx="12" cy="13" r="1" fill={c} />
      {/* Highlighted day */}
      <Circle cx="17" cy="13" r="2.5" fill={c} opacity="0.85" />
      <Circle cx="7" cy="17" r="1" fill={c} opacity="0.3" />
      <Circle cx="12" cy="17" r="1" fill={c} opacity="0.3" />
    </G>
  ),

  settings: (c) => (
    <G>
      {/* Three horizontal sliders */}
      <Line x1="3" y1="7" x2="13" y2="7" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="16" cy="7" r="2.5" fill="none" stroke={c} strokeWidth="1.5" />
      <Line x1="18.5" y1="7" x2="21" y2="7" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="8" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="11" cy="12" r="2.5" fill="none" stroke={c} strokeWidth="1.5" />
      <Line x1="13.5" y1="12" x2="21" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="3" y1="17" x2="18" y2="17" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="20.5" cy="17" r="2" fill="none" stroke={c} strokeWidth="1.5" />
    </G>
  ),

  // ── Section Headers ─────────────────────────────────────
  cycle: (c) => (
    <G>
      {/* Circular arrows */}
      <Path
        d="M 17,6 A 7,7 0 0,1 12,19 A 7,7 0 0,1 5,14"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"
      />
      <Path
        d="M 7,18 A 7,7 0 0,1 12,5 A 7,7 0 0,1 19,10"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"
      />
      {/* Arrowheads */}
      <Polyline points="17,4 17,8 13,8" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="7,20 7,16 11,16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  ),

  weather: (c) => (
    <G>
      {/* Sun circle */}
      <Circle cx="12" cy="12" r="4" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Rays */}
      <Line x1="12" y1="5" x2="12" y2="7" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12" y2="19" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="7" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="17" y1="12" x2="19" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="7" y1="7" x2="8.5" y2="8.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="15.5" y1="15.5" x2="17" y2="17" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="7" y1="17" x2="8.5" y2="15.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="15.5" y1="8.5" x2="17" y2="7" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
    </G>
  ),

  stats: (c) => (
    <G>
      {/* Trend line — gentle rise */}
      <Polyline
        points="3,17 7,13 11,14 15,8 21,6"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Data dot at end */}
      <Circle cx="21" cy="6" r="2" fill={c} />
      {/* Baseline */}
      <Line x1="3" y1="20" x2="21" y2="20" stroke={c} strokeWidth="0.8" opacity="0.3" />
    </G>
  ),

  // ── Settings & Actions ───────────────────────────────────
  bell: (c) => (
    <G>
      <Path
        d="M 7,9 C 7,6 9,4 12,4 C 15,4 17,6 17,9 L 18,12 C 18.5,13.5 19,14 19,15 L 5,15 C 5,14 5.5,13.5 6,12 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      <Path d="M 10,17 A 2,2 0 0,0 14,17" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="6" y1="15" x2="18" y2="15" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </G>
  ),

  drop: (c) => (
    <G>
      {/* Teardrop — fluid, elegant */}
      <Path
        d="M 12,3 C 12,3 5,10 5,15 A 7,7 0 0,0 19,15 C 19,10 12,3 12,3 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* Inner highlight */}
      <Path
        d="M 12,6 C 12,6 7,11 7,15 A 1.5,1.5 0 0,0 10,16"
        fill="none" stroke={c} strokeWidth="0.8" strokeLinecap="round" opacity="0.4"
      />
    </G>
  ),

  clipboard: (c) => (
    <G>
      {/* Board */}
      <Rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Clip */}
      <Path d="M 8,3 L 8,6 L 16,6 L 16,3" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Text lines */}
      <Line x1="8" y1="10" x2="16" y2="10" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <Line x1="8" y1="13" x2="14" y2="13" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <Line x1="8" y1="16" x2="15" y2="16" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </G>
  ),

  warning: (c) => (
    <G>
      {/* Triangle */}
      <Path d="M 12,3 L 22,20 L 2,20 Z" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Exclamation */}
      <Line x1="12" y1="9" x2="12" y2="14" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="0.8" fill={c} />
    </G>
  ),

  backup: (c) => (
    <G>
      {/* Cylinder/database shape */}
      <Path d="M 5,6 C 5,4 8,3 12,3 C 16,3 19,4 19,6 L 19,18 C 19,20 16,21 12,21 C 8,21 5,20 5,18 Z"
        fill="none" stroke={c} strokeWidth="1.5" />
      <Ellipse2 cx={12} cy={6} rx={7} ry={2} fill="none" stroke={c} strokeWidth="1.2" />
    </G>
  ),

  export: (c) => (
    <G>
      {/* Arrow pointing up-right from box */}
      <Line x1="12" y1="18" x2="12" y2="8" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Polyline points="8,11 12,7 16,11" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="7" y1="6" x2="17" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </G>
  ),

  import: (c) => (
    <G>
      {/* Arrow pointing down-left into box */}
      <Line x1="12" y1="6" x2="12" y2="16" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Polyline points="8,13 12,17 16,13" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="7" y1="18" x2="17" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </G>
  ),

  info: (c) => (
    <G>
      <Circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.5" />
      <Line x1="12" y1="8" x2="12" y2="8.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      <Circle cx="12" cy="17.5" r="0.6" fill={c} />
    </G>
  ),

  diet: (c) => (
    <G>
      {/* Bowl shape */}
      <Path d="M 5,10 A 7,7 0 0,0 19,10" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M 5,10 C 5,14 8,18 12,18 C 16,18 19,14 19,10" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Steam lines */}
      <Path d="M 10,6 Q 11,3 10,1" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <Path d="M 14,6 Q 15,2 14,0" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </G>
  ),

  // ── Weather & Status ────────────────────────────────────
  sun: (c) => (
    <G>
      <Circle cx="12" cy="12" r="5" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Rays at 8 compass points */}
      <Line x1="12" y1="2" x2="12" y2="4.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="19.5" x2="12" y2="22" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="2" y1="12" x2="4.5" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="19.5" y1="12" x2="22" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="4.9" y1="4.9" x2="6.7" y2="6.7" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="17.3" y1="17.3" x2="19.1" y2="19.1" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="4.9" y1="19.1" x2="6.7" y2="17.3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="17.3" y1="6.7" x2="19.1" y2="4.9" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </G>
  ),

  sparkle: (c) => (
    <G>
      {/* Four-point star / sparkle */}
      <Path
        d="M 12,2 L 13.5,9 L 21,9 L 14.5,13.5 L 17,21 L 12,15.5 L 7,21 L 9.5,13.5 L 3,9 L 10.5,9 Z"
        fill="none" stroke={c} strokeWidth="1.3" strokeLinejoin="round"
      />
    </G>
  ),

  bulb: (c) => (
    <G>
      {/* Bulb body */}
      <Path
        d="M 9,10 C 9,7 10.5,4 12,4 C 13.5,4 15,7 15,10 C 15,13 16,14.5 16,16 L 8,16 C 8,14.5 9,13 9,10 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* Filament lines */}
      <Path d="M 11,7 C 11.5,6 12.5,6 13,7" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" />
      {/* Base */}
      <Line x1="9" y1="18" x2="15" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="10" y1="20" x2="14" y2="20" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Rays */}
      <Line x1="5" y1="9" x2="7" y2="9" stroke={c} strokeWidth="1" strokeLinecap="round" />
      <Line x1="17" y1="9" x2="19" y2="9" stroke={c} strokeWidth="1" strokeLinecap="round" />
    </G>
  ),

  blood: (c) => (
    <G>
      {/* Blood drop — slightly fuller than the teardrop */}
      <Path
        d="M 12,2 C 12,2 4,10 4,16 A 8,8 0 0,0 20,16 C 20,10 12,2 12,2 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* Inner droplet */}
      <Circle cx="12" cy="15" r="2" fill={c} opacity="0.3" />
    </G>
  ),

  egg: (c) => (
    <G>
      {/* Egg/ovum shape */}
      <Path
        d="M 12,3 C 12,3 6,9 6,14 A 6,6 0 0,0 18,14 C 18,9 12,3 12,3 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* Inner nucleus */}
      <Circle cx="12" cy="13" r="1.8" fill="none" stroke={c} strokeWidth="1" />
    </G>
  ),

  dot: (c) => (
    <Circle cx="12" cy="12" r="7" fill={c} />
  ),

  leaf: (c) => (
    <G>
      {/* Leaf shape */}
      <Path
        d="M 12,2 C 12,2 6,9 6,14 C 6,18 9,21 12,21 C 15,21 18,18 18,14 C 18,9 12,2 12,2 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* Center vein */}
      <Line x1="12" y1="6" x2="12" y2="19" stroke={c} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
    </G>
  ),

  check: (c) => (
    <Polyline points="4,12 10,18 20,6" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),

  chevron: (c) => (
    <Polyline points="8,5 16,12 8,19" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),

  close: (c) => (
    <G>
      <Line x1="6" y1="6" x2="18" y2="18" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="6" x2="6" y2="18" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </G>
  ),

  'chevron-down': (c) => (
    <Polyline points="5,9 12,17 19,9" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),

  lightning: (c) => (
    <Polyline
      points="13,3 6,14 12,14 9,21 18,10 12,10 15,3"
      fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    />
  ),

  battery: (c) => (
    <G>
      <Rect x="2" y="7" width="18" height="10" rx="2" fill="none" stroke={c} strokeWidth="1.5" />
      <Line x1="22" y1="10" x2="22" y2="14" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <Rect x="6" y="10" width="10" height="4" rx="1" fill={c} opacity="0.5" />
    </G>
  ),

  location: (c) => (
    <G>
      <Path
        d="M 12,2 C 8,2 5,5 5,9 C 5,15 12,22 12,22 C 12,22 19,15 19,9 C 19,5 16,2 12,2 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      <Circle cx="12" cy="9" r="3" fill="none" stroke={c} strokeWidth="1.5" />
    </G>
  ),

  edit: (c) => (
    <G>
      <Path
        d="M 15,4 L 20,9 L 8,21 L 3,21 L 3,16 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      <Line x1="12" y1="12" x2="18" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </G>
  ),

  moon: (c) => (
    <Path
      d="M 20,14 A 8,8 0 0,1 6,6 A 8.5,8.5 0 1,0 20,14 Z"
      fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
    />
  ),
};

export default function Icon({ name, size = 24, color = Colors.ink }: IconProps) {
  const render = PATHS[name];
  if (!render) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {render(color)}
    </Svg>
  );
}

export { PATHS };
