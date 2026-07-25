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
  | 'leaf'       // Leaf for follicular / growth phase
  | 'close'      // X mark for inappropriate/avoid
  | 'chevron-down'  // Down chevron
  | 'lightning'    // Bolt for sharp pain
  | 'battery'     // Battery for energy/normal
  | 'location'    // Map pin for city/location
  | 'edit'        // Pencil/edit
  | 'moon'        // Crescent moon for evening
  | 'wind'        // Wind lines for weather
  | 'refresh'     // Circular refresh arrow
  | 'cloud'       // Cloud shape for weather
  // ── Symptom-specific icons ───────────────────────────
  | 'droplet'      // 少量 — single light drop
  | 'drops'        // 较多 — two overlapping drops
  | 'check-circle' // 无痛经 — circle with checkmark
  | 'wave'         // 轻微痛经 — gentle wave
  | 'zigzag'       // 中等痛经 — sharp cramp wave
  | 'smile'        // 开心 — happy face
  | 'zen'          // 平静 — peaceful circle
  | 'storm'        // 烦躁 — storm cloud
  | 'frown'        // 难过 — sad face
  | 'nervous'      // 焦虑 — anxious scribble
  | 'battery-full' // 充沛 — full battery
  | 'battery-low'  // 疲惫 — low battery
  | 'head'         // 头痛 — head with pain
  | 'bloat'        // 腹胀 — bloated belly
  | 'cookie'       // 嘴馋 — cookie/sweet
  | 'backPain'     // 腰骶部酸痛 — spine/back
  | 'breastPain'   // 乳房胀痛 — breast/chest
  | 'skinSensitive'; // 皮肤敏感 — skin/irritation

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
      <Line x1="12" y1="8" x2="12" y2="8.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
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
    <Polyline points="4,12 10,18 20,6" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),

  chevron: (c) => (
    <Polyline points="8,5 16,12 8,19" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),

  close: (c) => (
    <G>
      <Line x1="6" y1="6" x2="18" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="18" y1="6" x2="6" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </G>
  ),

  'chevron-down': (c) => (
    <Polyline points="5,9 12,17 19,9" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),

  lightning: (c) => (
    <G>
      {/* Half-body figure + round belly with sharp spasm — 严重痛经 */}
      {/* Head */}
      <Circle cx="12" cy="4.5" r="3" fill="none" stroke={c} strokeWidth="1.3" />
      {/* Arms gripping in */}
      <Line x1="10" y1="10.5" x2="5" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="14" y1="10.5" x2="19" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      {/* Torso sides — tighter, tense */}
      <Line x1="7.5" y1="8" x2="7" y2="11.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="16.5" y1="8" x2="17" y2="11.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      {/* Round belly — larger, tense */}
      <Circle cx="12" cy="14.5" r="5" fill="none" stroke={c} strokeWidth="1.3" />
      {/* Sharp spasm bolt through belly */}
      <Polyline points="10,11.5 8.5,14 11.5,13 10,17" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Pain radiating from belly */}
      <Line x1="6" y1="12" x2="3.5" y2="10.5" stroke={c} strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
      <Line x1="18" y1="12" x2="20.5" y2="10.5" stroke={c} strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
      <Line x1="8.5" y1="9" x2="7" y2="7" stroke={c} strokeWidth="0.9" strokeLinecap="round" opacity="0.4" />
    </G>
  ),

  battery: (c) => (
    <G>
      <Rect x="2" y="7" width="18" height="10" rx="2" fill="none" stroke={c} strokeWidth="1.5" />
      <Line x1="22" y1="10" x2="22" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
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
  wind: (c) => (
    <Path
      d="M 3,8 C 7,6 13,9 16,8 M 3,12 C 8,10 14,13 18,12 M 3,16 C 6,15 11,17 14,16"
      fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"
    />
  ),
  refresh: (c) => (
    <Path
      d="M 21,12 A 9,9 0 1,1 18,5 M 21,3 L 21,8 L 16,8"
      fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    />
  ),
  cloud: (c) => (
    <Path
      d="M 6,18 C 3,18 1,15 2,12 C 0.5,9.5 2.5,6 5.5,6 C 7,3.5 10,2 13,4 C 16.5,3 20,6 19,10 C 22,11 22,15 19,17 C 17,18 12,18 6,18 Z"
      fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
    />
  ),

  // ── Symptom Icons ──────────────────────────────────────

  droplet: (c) => (
    <G>
      {/* Single small drop — 少量 */}
      <Path
        d="M 12,5 C 12,5 7,11 7,14 A 5,5 0 0,0 17,14 C 17,11 12,5 12,5 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      <Path d="M 12,8 C 12,8 9,11 9,14 A 1,1 0 0,0 11,14.5"
        fill="none" stroke={c} strokeWidth="0.7" strokeLinecap="round" opacity="0.4" />
    </G>
  ),

  drops: (c) => (
    <G>
      {/* Two overlapping drops — 较多 */}
      <Path
        d="M 8,6 C 8,6 3,12 3,15 A 5,5 0 0,0 13,15 C 13,12 8,6 8,6 Z"
        fill="none" stroke={c} strokeWidth="1.3" strokeLinejoin="round"
      />
      <Path
        d="M 14,4 C 14,4 9,10 9,13 A 5,5 0 0,0 19,13 C 19,10 14,4 14,4 Z"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
    </G>
  ),

  'check-circle': (c) => (
    <G>
      {/* OK badge — 无痛经 */}
      <Circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.5" />
      <Polyline points="7,12 10.5,15.5 17,8.5" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  ),

  wave: (c) => (
    <G>
      {/* Half-body figure + round belly with mild pulse — 轻微痛经 */}
      {/* Head */}
      <Circle cx="12" cy="4.5" r="3" fill="none" stroke={c} strokeWidth="1.3" />
      {/* Arms */}
      <Line x1="6.5" y1="8.5" x2="3.5" y2="10" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="17.5" y1="8.5" x2="20.5" y2="10" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      {/* Torso sides */}
      <Line x1="7.5" y1="8" x2="7.5" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="16.5" y1="8" x2="16.5" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      {/* Round belly */}
      <Circle cx="12" cy="14.5" r="5" fill="none" stroke={c} strokeWidth="1.3" />
      {/* Mild pulse wave through belly — subtle */}
      <Path d="M 9,14 Q 12,13 15,14" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </G>
  ),

  zigzag: (c) => (
    <G>
      {/* Half-body figure + round belly with cramp squeeze — 中等痛经 */}
      {/* Head */}
      <Circle cx="12" cy="4.5" r="3" fill="none" stroke={c} strokeWidth="1.3" />
      {/* Arms */}
      <Line x1="6.5" y1="8.5" x2="3.5" y2="10" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="17.5" y1="8.5" x2="20.5" y2="10" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      {/* Torso sides */}
      <Line x1="7.5" y1="8" x2="7.5" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="16.5" y1="8" x2="16.5" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      {/* Round belly */}
      <Circle cx="12" cy="14.5" r="5" fill="none" stroke={c} strokeWidth="1.3" />
      {/* Tension zigzag across belly */}
      <Path d="M 9,13.5 L 10.5,15 L 12,13.5 L 13.5,15 L 15,13.5" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Squeeze indentation at belly bottom */}
      <Path d="M 8.5,16 C 10,17.5 14,17.5 15.5,16" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </G>
  ),

  smile: (c) => (
    <G>
      {/* Happy face — 开心 */}
      <Circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Happy squint eyes (⌣ shape) */}
      <Path d="M 7.5,10.5 Q 9,9 10.5,10.5" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M 13.5,10.5 Q 15,9 16.5,10.5" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      {/* Big smile */}
      <Path d="M 7.5,14.5 A 5,5.5 0 0,0 16.5,14.5" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Blush circles */}
      <Circle cx="6" cy="15" r="2" fill={c} opacity="0.12" />
      <Circle cx="18" cy="15" r="2" fill={c} opacity="0.12" />
    </G>
  ),

  zen: (c) => (
    <G>
      {/* Calm face — 平静 */}
      <Circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Closed serene eyes (two horizontal lines) */}
      <Line x1="7" y1="10.5" x2="10" y2="10.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="14" y1="10.5" x2="17" y2="10.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      {/* Gentle small smile */}
      <Path d="M 9.5,14.5 A 2.5,2 0 0,0 14.5,14.5" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
    </G>
  ),

  storm: (c) => (
    <G>
      {/* Irritated face — 烦躁 */}
      <Circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Furrowed angry eyebrows (diagonal inward) */}
      <Line x1="6" y1="9" x2="10" y2="9.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="18" y1="9" x2="14" y2="9.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      {/* Angry narrow eyes */}
      <Circle cx="8.5" cy="11" r="1" fill={c} />
      <Circle cx="15.5" cy="11" r="1" fill={c} />
      {/* Displeased flat mouth */}
      <Line x1="8.5" y1="16" x2="15.5" y2="16" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      {/* Tension marks ⟋ top */}
      <Line x1="5" y1="6" x2="3.5" y2="5" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <Line x1="7" y1="4" x2="6" y2="2.5" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </G>
  ),

  frown: (c) => (
    <G>
      {/* Sad face — 难过 */}
      <Circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Eyes */}
      <Circle cx="9" cy="10" r="1" fill={c} />
      <Circle cx="15" cy="10" r="1" fill={c} />
      {/* Frown */}
      <Path d="M 7.5,17 A 5,5 0 0,1 16.5,17" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Tear */}
      <Path d="M 15.5,12 C 16.5,14 17,15.5 17,16.5 A 1.5,1.5 0 0,1 14,16.5 C 14,15.5 14.5,14 15.5,12 Z"
        fill={c} opacity="0.35" />
    </G>
  ),

  nervous: (c) => (
    <G>
      {/* Anxious face — 焦虑 */}
      <Circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Wide open anxious eyes */}
      <Circle cx="9" cy="10.5" r="2.2" fill="none" stroke={c} strokeWidth="1.3" />
      <Circle cx="15" cy="10.5" r="2.2" fill="none" stroke={c} strokeWidth="1.3" />
      {/* Small darting pupils */}
      <Circle cx="9.5" cy="10.5" r="0.8" fill={c} />
      <Circle cx="15.5" cy="10.5" r="0.8" fill={c} />
      {/* Wobbly anxious mouth */}
      <Path d="M 8,15.5 Q 10,14.5 12,15.5 T 16,15.5" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      {/* Sweat drop on forehead */}
      <Path d="M 13,4 C 13.5,5.5 14,6.5 14,7.5 A 1.2,1.2 0 0,1 11.6,7.5 C 11.6,6.5 12,5.5 13,4 Z" fill={c} opacity="0.3" />
    </G>
  ),

  'battery-full': (c) => (
    <G>
      {/* Full battery + charge bolt — 充沛 */}
      <Rect x="2" y="7" width="18" height="10" rx="2" fill="none" stroke={c} strokeWidth="1.5" />
      <Line x1="22" y1="10" x2="22" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Full fill bars */}
      <Rect x="5" y="9.5" width="3.5" height="5" rx="0.5" fill={c} />
      <Rect x="9.5" y="9.5" width="3.5" height="5" rx="0.5" fill={c} />
      <Rect x="14" y="9.5" width="3.5" height="5" rx="0.5" fill={c} />
      {/* Tiny bolt overlay */}
      <Polyline points="11.5,7 10,10 11.5,10 10.5,13" fill="none" stroke={c} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </G>
  ),

  'battery-low': (c) => (
    <G>
      {/* Low battery — 疲惫 */}
      <Rect x="2" y="7" width="18" height="10" rx="2" fill="none" stroke={c} strokeWidth="1.5" />
      <Line x1="22" y1="10" x2="22" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Only one low fill bar */}
      <Rect x="5" y="9.5" width="3.5" height="5" rx="0.5" fill={c} opacity="0.4" />
    </G>
  ),

  head: (c) => (
    <G>
      {/* Head silhouette — 头痛 */}
      <Circle cx="12" cy="10" r="5" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Neck/shoulders */}
      <Path d="M 7,14 C 7,18 5,20 4,22" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M 17,14 C 17,18 19,20 20,22" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      {/* Pain marks radiating from temples */}
      <Line x1="7" y1="7" x2="4.5" y2="5" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="9" y1="5" x2="8" y2="2.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="12" y1="4.5" x2="12" y2="2" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      {/* Pain expression — tight line mouth */}
      <Line x1="10" y1="12" x2="14" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
    </G>
  ),

  bloat: (c) => (
    <G>
      {/* Bloated belly — 腹胀 */}
      <Path
        d="M 7,6 C 4,6 3,10 5,14 C 6,17 7,19 12,19 C 17,19 18,17 19,14 C 21,10 20,6 17,6"
        fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"
      />
      {/* Horizontal line across bloated area */}
      <Line x1="7" y1="12" x2="17" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      {/* Small gas bubbles */}
      <Circle cx="8" cy="9" r="1.2" fill={c} opacity="0.3" />
      <Circle cx="15" cy="10" r="0.8" fill={c} opacity="0.25" />
    </G>
  ),

  cookie: (c) => (
    <G>
      {/* Cookie/sweet — 嘴馋 */}
      <Circle cx="12" cy="13" r="8" fill="none" stroke={c} strokeWidth="1.5" />
      {/* Chocolate chips */}
      <Circle cx="9" cy="10" r="1.8" fill={c} opacity="0.5" />
      <Circle cx="14.5" cy="11" r="1.5" fill={c} opacity="0.5" />
      <Circle cx="11.5" cy="16" r="1.3" fill={c} opacity="0.4" />
      {/* Bite mark */}
      <Circle cx="18" cy="8" r="3" fill="none" stroke={c} strokeWidth="1.5" opacity="0.3" />
      {/* Steam/smell line */}
      <Path d="M 12,4 Q 13,2 12,0.5" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.35" />
    </G>
  ),

  backPain: (c) => (
    <G>
      {/* Spine/back — 腰骶部酸痛 */}
      <Line x1="12" y1="3" x2="12" y2="21" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="7" x2="16" y2="7" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <Line x1="8" y1="11" x2="16" y2="11" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <Line x1="8" y1="15" x2="16" y2="15" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      {/* Pain spark */}
      <Line x1="18" y1="5" x2="20" y2="3" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <Line x1="20" y1="5" x2="18" y2="3" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </G>
  ),

  breastPain: (c) => (
    <G>
      {/* Breast/chest — 乳房胀痛 */}
      <Path d="M 8,21 C 8,14 10,11 12,11 C 14,11 16,14 16,21" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M 6,16 C 6,12 8,9 12,9 C 16,9 18,12 18,16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      {/* Pain dots */}
      <Circle cx="12" cy="14" r="0.8" fill={c} opacity="0.5" />
      <Circle cx="10" cy="12" r="0.6" fill={c} opacity="0.4" />
      <Circle cx="14" cy="12" r="0.6" fill={c} opacity="0.4" />
    </G>
  ),

  skinSensitive: (c) => (
    <G>
      {/* Skin/arm with irritation — 皮肤敏感 */}
      <Path d="M 6,8 C 6,5 8,3 10,3 L 14,3 C 16,3 18,5 18,8 L 18,20" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Irritation dots */}
      <Circle cx="15" cy="10" r="0.8" fill={c} opacity="0.5" />
      <Circle cx="13" cy="14" r="0.6" fill={c} opacity="0.4" />
      <Circle cx="16" cy="16" r="0.7" fill={c} opacity="0.45" />
      <Circle cx="11" cy="9" r="0.6" fill={c} opacity="0.35" />
      {/* Zigzag for sensitivity */}
      <Path d="M 7,16 L 8,14 L 7,12 L 8,10" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    </G>
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

