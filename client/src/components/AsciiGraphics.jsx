import React, { useState, useEffect } from 'react';

/**
 * GRAPHIC 1 (ASCII): Ghost Mascot ("Seeker")
 * Rich, detailed ASCII art featuring box-drawing curves, block shading (░▒▓),
 * expressive animated eyes, arms holding a scanner lens, rippling wavy hem,
 * and live tracking telemetry.
 */
export function AsciiGhostMascot({ hero = false, compact = false }) {
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = [
    {
      art: [
        '        .--------.        ',
        '      ╭─ ░░░░░░░░ ─╮      ',
        '     ╱   ░░░░░░░░   ╲     ',
        '    │   ( ◉    ◉ )   │  ✦ ',
        '   ╭│    ░  ──  ░    │╮   ',
        '   ││   (   ω    )   ││   ',
        '    │   ╰────────╯   │    ',
        '    │   ░░░░░░░░░░   │    ',
        '     ╲   ▒▒▒▒▒▒▒▒   ╱     ',
        '      ╲_╱╲_╱╲_╱╲_╱        ',
        '        ~   ~   ~         ',
      ],
      mode: 'SCOUTING',
      caption: 'searching workspace',
      status: 'idle patrol',
      code: 'RADAR: ACTIVE',
    },
    {
      art: [
        '        .--------.        ',
        '      ╭─ ░░░░░░░░ ─╮  *   ',
        '     ╱   ░░░░░░░░   ╲     ',
        '    │   ( ◕    ◕ )   │╭──╮',
        '   ╭│    ░  <   ░    │┤o=│',
        '   ││   (  \\u/   )   │╰──╯',
        '    │   ╰────────╯   │ ?  ',
        '    │   ░░░░░░░░░░   │    ',
        '     ╲   ▒▒▒▒▒▒▒▒   ╱     ',
        '      ╲_╱╲_╱╲_╱╲_╱        ',
        '        ~   ~   ~         ',
      ],
      mode: 'TARGETING',
      caption: 'signal detected',
      status: 'evaluating traits',
      code: 'LOCK: LOCATING',
    },
    {
      art: [
        '        .--------.     !  ',
        '      ╭─ ░░░░░░░░ ─╮ ╭───╮',
        '     ╱   ░░░░░░░░   ╲│[!]│',
        '    │   ( ✦    ✦ )   │╰─┬╯',
        '   ╭│    ░  ^   ░    │╮ │ ',
        '   ││   [ FOUND! ]   ││─╯ ',
        '    │   ╰────────╯   │    ',
        '    │   ░░░░░░░░░░   │    ',
        '     ╲   ▒▒▒▒▒▒▒▒   ╱     ',
        '      ╲_╱╲_╱╲_╱╲_╱        ',
        '        ~   ~   ~         ',
      ],
      mode: 'LOCKED',
      caption: 'item located',
      status: 'traits verified (example)',
      code: 'PAIR: SECURE',
    },
    {
      art: [
        '        .--------.    ♪   ',
        '      ╭─ ░░░░░░░░ ─╮      ',
        '     ╱   ░░░░░░░░   ╲   * ',
        '    │   ( ^    ~ )   │  ✦ ',
        '   ╭│    ░ \\u/  ░    │╮   ',
        '   ││   (   <3   )   ││   ',
        '    │   ╰────────╯   │    ',
        '    │   ░░░░░░░░░░   │    ',
        '     ╲   ▒▒▒▒▒▒▒▒   ╱     ',
        '      ╲_╱╲_╱╲_╱╲_╱        ',
        '        ~   ~   ~         ',
      ],
      mode: 'VERIFIED',
      caption: 'owner authenticated',
      status: 'custody ready',
      code: 'HANDOVER: READY',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 750);
    return () => clearInterval(timer);
  }, [frames.length]);

  const active = frames[frameIndex];

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0a] text-white border border-[#222222] shadow-sm select-none">
        <pre className="font-mono text-[9px] leading-none text-red-400 font-bold">
          (◕‿◕)
        </pre>
        <span className="text-[10px] font-mono text-neutral-300">
          Seeker: {active.caption}
        </span>
      </div>
    );
  }

  // Hero Card Presentation for Top of Landing Page
  if (hero) {
    return (
      <div className="rounded-2xl border border-[#262626] bg-[#0c0c0e] text-white p-5 sm:p-6 shadow-xl select-none relative overflow-hidden group">
        {/* Terminal Header */}
        <div className="flex items-center justify-between text-xs font-mono border-b border-[#222222] pb-3 text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-white">
              SEEKER · HAVEN MASCOT
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#181818] text-[10px] text-neutral-300 border border-[#2a2a2a]">
            FRAME 0{frameIndex + 1}/04
          </span>
        </div>

        {/* High-Contrast Obsidian Screen */}
        <div className="my-4 py-4 px-2 flex flex-col items-center justify-center bg-[#050505] rounded-xl border border-[#1a1a1a]">
          <pre className="font-mono text-xs sm:text-sm leading-tight text-neutral-100 transition-all duration-150 text-center font-bold tracking-tight">
            {active.art.join('\n')}
          </pre>
        </div>

        {/* Telemetry Footer */}
        <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-xs font-mono">
          <div className="space-y-0.5">
            <div className="text-[10px] text-neutral-400 font-medium uppercase">MODE: {active.mode}</div>
            <div className="font-bold text-white uppercase text-[11px]">{active.caption}</div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-[10px] text-neutral-400 font-medium uppercase">STATUS</div>
            <div className="font-semibold text-emerald-400 text-[11px]">{active.status}</div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Bento Card Presentation
  return (
    <div className="rounded-xl border border-[#262626] bg-[#0c0c0e] text-white p-3.5 space-y-2 select-none shadow-md">
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#222222] pb-1.5 text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-white">
            MASCOT · SEEKER
          </span>
        </div>
        <span className="uppercase text-[9px] text-neutral-400">F-0{frameIndex + 1}/04</span>
      </div>

      {/* Guaranteed High-Contrast Terminal Canvas */}
      <div className="py-2.5 flex flex-col items-center justify-center bg-[#050505] rounded-lg border border-[#1a1a1a]">
        <pre className="font-mono text-xs leading-tight text-neutral-100 transition-all duration-150 text-center font-bold">
          {active.art.join('\n')}
        </pre>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
        <span className="text-neutral-400 font-medium uppercase">STATUS:</span>
        <span className="font-semibold text-red-400 uppercase">
          {active.caption}
        </span>
      </div>
    </div>
  );
}

/**
 * GRAPHIC 2 (ASCII): Lost & Found Radar ("AsciiLostScanner")
 * High-contrast terminal display with coordinate grids, target crosshairs,
 * and deterministic attribute correlation. Guaranteed high contrast in both modes.
 */
export function AsciiLostScanner() {
  const [step, setStep] = useState(0);

  const radarFrames = [
    {
      lines: [
        '┌───────────────────────────────┐',
        '│ SCAN: CAMPUS QUAD · FL.2      │',
        '│ ┌───────────────────────────┐ │',
        '│ │ · · · · · · · ╱ · · · · · │ │',
        '│ │ · · · · · ·  ╱  · · · · · │ │',
        '│ │ · · · · · · ╱ · · · · · · │ │',
        '│ │ · · · · · [◉] · · · · · · │ │',
        '│ │ · · · · · · ╲ · · · · · · │ │',
        '│ │ · · · · · ·  ╲  · · · · · │ │',
        '│ └───────────────────────────┘ │',
        '│ TARGET: SWEEPING (12 ZONES)   │',
        '└───────────────────────────────┘',
      ],
      tag: 'SCANNING',
      detail: 'GRID SWEEP: 28%',
      color: 'text-neutral-300',
    },
    {
      lines: [
        '┌───────────────────────────────┐',
        '│ DETECT: ACTIVE EMISSION       │',
        '│ ┌───────────────────────────┐ │',
        '│ │ · · · · · · · · ╭───╮ · · │ │',
        '│ │ · · · · · · · · │[?]│←SIG │ │',
        '│ │ · · · · · · · · ╰───╯ · · │ │',
        '│ │ · · · · · [◉]──"  · · · · │ │',
        '│ │ · · · · · · · · · · · · · │ │',
        '│ │ · · · · · · · · · · · · · │ │',
        '│ └───────────────────────────┘ │',
        '│ TARGET: MISSING ID CARD       │',
        '└───────────────────────────────┘',
      ],
      tag: 'DETECTED',
      detail: 'ITEM: ID_CARD_04',
      color: 'text-amber-400',
    },
    {
      lines: [
        '┌───────────────────────────────┐',
        '│ LOCK: ATTRIBUTE MATCHING      │',
        '│ ┌───────────────────────────┐ │',
        '│ │ · · · · · · · · ╭───╮ · · │ │',
        '│ │ · · · · · · · · │[*]│←LOCK│ │',
        '│ │ · · · · · · · · ╰───╯ · · │ │',
        '│ │ · · · · · [◉]═══╗ · · · · │ │',
        '│ │ · · · · · · · · ║ · · · · │ │',
        '│ │ · · · · · · · · ╚═> MATCH │ │',
        '│ └───────────────────────────┘ │',
        '│ EXAMPLE: ATTRIBUTE MATCHING   │',
        '└───────────────────────────────┘',
      ],
      tag: 'CORRELATING',
      detail: 'EXAMPLE: 98.4% MATCH',
      color: 'text-emerald-400',
    },
    {
      lines: [
        '┌───────────────────────────────┐',
        '│ CONFIRMED: RECOVERY READY     │',
        '│ ┌───────────────────────────┐ │',
        '│ │ · · · · · · · · · · · · · │ │',
        '│ │ · · · · ╔═════════╗ · · · │ │',
        '│ │ · · · · ║ [FOUND] ║ · · · │ │',
        '│ │ · · · · ╚═════════╝ · · · │ │',
        '│ │ · · · · · [◉]══> QUEUED · │ │',
        '│ │ · · · · · · · · · · · · · │ │',
        '│ └───────────────────────────┘ │',
        '│ CUSTODY: LOCKED TO DESK       │',
        '└───────────────────────────────┘',
      ],
      tag: 'VERIFIED',
      detail: 'CUSTODY QUEUED',
      color: 'text-emerald-400',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((p) => (p + 1) % radarFrames.length);
    }, 850);
    return () => clearInterval(timer);
  }, [radarFrames.length]);

  const current = radarFrames[step];

  return (
    <div className="rounded-xl border border-[#262626] bg-[#0c0c0e] text-white p-3.5 space-y-2 select-none shadow-md h-[280px] flex flex-col justify-between">
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#222222] pb-1.5 text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-white">
            RADAR · ATTRIBUTE SCAN
          </span>
        </div>
        <span className="uppercase text-[9px] text-neutral-400">STEP 0{step + 1}/04</span>
      </div>

      {/* Guaranteed High-Contrast Terminal Screen */}
      <div className="flex-1 py-1.5 px-1 flex flex-col items-center justify-center bg-[#050505] rounded-lg border border-[#1a1a1a]">
        <pre className="font-mono text-[9.5px] sm:text-[10px] leading-tight text-neutral-100 transition-all duration-150 text-center font-bold">
          {current.lines.join('\n')}
        </pre>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
        <span className="text-neutral-400 font-medium uppercase">{current.tag}</span>
        <span className={`font-bold ${current.color}`}>
          {current.detail}
        </span>
      </div>
    </div>
  );
}

/**
 * GRAPHIC 3 (NORMAL / VECTOR SVG): Custody Handover Vault ("NormalCustodyVault")
 * A crisp, architectural vector graphic illustrating a secure physical lost-and-found
 * custody locker with a 6-digit keypad, viewport, and verification badge.
 */
export function NormalCustodyVault() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse((p) => !p);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const pinDigits = pulse ? ['7', '3', '9', '4', '0', '1'] : ['•', '•', '•', '•', '•', '•'];

  return (
    <div className="rounded-xl border border-[#262626] bg-[#0c0c0e] text-white p-3.5 space-y-2 select-none shadow-md h-[280px] flex flex-col justify-between">
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#222222] pb-1.5 text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${pulse ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span className="font-bold uppercase tracking-wider text-white">
            CUSTODY · HANDOVER VAULT
          </span>
        </div>
        <span className="uppercase text-[9px] font-semibold text-emerald-400">
          ARMED
        </span>
      </div>

      {/* Modern Extended SVG Illustration */}
      <div className="flex-1 py-1 px-2 flex flex-col items-center justify-center bg-[#050505] rounded-lg border border-[#1a1a1a]">
        <svg
          viewBox="0 0 240 148"
          className="w-full h-[175px] text-white max-w-[250px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Locker Body Outer */}
          <rect
            x="8"
            y="6"
            width="224"
            height="136"
            rx="6"
            className="fill-[#141416] stroke-[#333333]"
            strokeWidth="1.5"
          />

          {/* Compartment 1: Protected Viewport & Locker */}
          <rect
            x="16"
            y="14"
            width="94"
            height="120"
            rx="4"
            className="fill-[#0a0a0c] stroke-[#262626]"
            strokeWidth="1"
          />

          {/* Interior Shelf Divider */}
          <line x1="16" y1="80" x2="110" y2="80" stroke="#262626" strokeWidth="1" />

          {/* Secure 3D Isometric Item on Top Shelf */}
          <path
            d="M48 42 L67 32 L83 40 L64 50 Z"
            className="fill-neutral-500"
          />
          <path
            d="M48 42 L48 62 L64 70 L64 50 Z"
            className="fill-neutral-600"
          />
          <path
            d="M64 50 L64 70 L83 60 L83 40 Z"
            className="fill-neutral-500"
          />
          {/* Item Tag Pin */}
          <circle cx="73" cy="28" r="3.5" className="fill-red-500" />
          <line x1="73" y1="31.5" x2="73" y2="40" stroke="#ef4444" strokeWidth="1.2" />

          {/* Bottom Shelf Custody Bay Status */}
          <rect
            x="22"
            y="90"
            width="82"
            height="16"
            rx="2"
            className="fill-[#111114] stroke-[#262626]"
            strokeWidth="0.8"
          />
          <circle cx="30" cy="98" r="2.5" className="fill-emerald-500" />
          <text x="37" y="101" className="fill-neutral-300 font-mono text-[7px] font-semibold">
            BAY: LOCK-09
          </text>
          <text x="98" y="101" textAnchor="end" className="fill-red-400 font-mono text-[7px] font-bold">
            ARMED
          </text>

          <text x="63" y="123" textAnchor="middle" className="fill-neutral-500 font-mono text-[6.5px]">
            PHYSICAL DEPOSITORY
          </text>

          {/* Compartment 2: 6-Digit Keypad & Security Interface */}
          <rect
            x="118"
            y="14"
            width="106"
            height="120"
            rx="4"
            className="fill-[#0e0e10] stroke-[#262626]"
            strokeWidth="1"
          />

          {/* 6-Digit Code Display (Discrete cells, strictly zero overflow) */}
          <rect
            x="124"
            y="20"
            width="94"
            height="20"
            rx="3"
            className="fill-black border border-[#222222]"
          />
          {pinDigits.map((char, i) => (
            <g key={i}>
              <rect
                x={127.5 + i * 15}
                y="23"
                width="12"
                height="14"
                rx="2"
                className="fill-[#111114]"
              />
              <text
                x={133.5 + i * 15}
                y="33.5"
                textAnchor="middle"
                className="fill-emerald-400 font-mono text-[8px] font-bold"
              >
                {char}
              </text>
            </g>
          ))}

          {/* Keypad Buttons Grid (3x3 numeric + action row) */}
          <circle cx="140" cy="50" r="4" className="fill-neutral-700" />
          <circle cx="158" cy="50" r="4" className="fill-neutral-700" />
          <circle cx="176" cy="50" r="4" className="fill-neutral-700" />
          <circle cx="194" cy="50" r="4" className="fill-neutral-700" />

          <circle cx="140" cy="64" r="4" className="fill-neutral-700" />
          <circle cx="158" cy="64" r="4" className="fill-neutral-700" />
          <circle cx="176" cy="64" r="4" className="fill-neutral-700" />
          <circle cx="194" cy="64" r="4" className="fill-neutral-700" />

          <circle cx="140" cy="78" r="4" className="fill-neutral-700" />
          <circle cx="158" cy="78" r="4" className="fill-neutral-700" />
          <circle cx="176" cy="78" r="4" className="fill-neutral-700" />
          <rect x="187" y="73" width="18" height="10" rx="2" className="fill-red-500" />
          <text x="196" y="80.5" textAnchor="middle" fill="#ffffff" className="font-mono text-[6px] font-bold">
            OK
          </text>

          {/* Telemetry Row: Cryptographic Challenge */}
          <rect
            x="124"
            y="92"
            width="94"
            height="14"
            rx="2"
            className="fill-[#161619]"
          />
          <text x="129" y="101.5" className="fill-neutral-300 font-mono text-[8px] font-medium">
            CHALLENGE:
          </text>
          <text x="212" y="101.5" textAnchor="end" className="fill-emerald-400 font-mono text-[7px] font-bold">
            HMAC-SHA256
          </text>

          {/* Status Indicators & Meta */}
          <circle cx="132" cy="115" r="3" className="fill-emerald-500" />
          <circle cx="143" cy="115" r="3" className="fill-neutral-600" />
          <circle cx="154" cy="115" r="3" className="fill-neutral-600" />
          <text x="212" y="117" textAnchor="end" className="fill-red-400 font-mono text-[7px] font-bold">
            ATOMIC LOCK
          </text>

          <text x="171" y="128" textAnchor="middle" className="fill-neutral-200 font-mono text-[8px] font-semibold">
            VERIFIED HANDOVER
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
        <span className="text-neutral-400 font-medium uppercase">AUTHENTICATION:</span>
        <span className="font-bold text-white">
          6-DIGIT PICKUP CODE
        </span>
      </div>
    </div>
  );
}

/**
 * GRAPHIC: Fast Photo Intake ("FastReportIntake")
 * Vector SVG graphic matching the exact chassis, telemetry, and aesthetic of
 * the Handover Vault. Features camera viewfinder, item outline, focus reticle,
 * and EXIF metadata stripping telemetry. Extended to h-[280px] with zero text overlaps.
 */
export function FastReportIntake() {
  const [activeFrame, setActiveFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFrame((p) => (p + 1) % 4);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-xl border border-[#262626] bg-[#0c0c0e] text-white p-3.5 space-y-2 select-none shadow-md h-[280px] flex flex-col justify-between">
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#222222] pb-1.5 text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-white">
            INTAKE · FAST REPORT LENS
          </span>
        </div>
        <span className="uppercase text-[9px] font-semibold text-emerald-400">
          ARMED
        </span>
      </div>

      {/* Modern Extended SVG Illustration */}
      <div className="flex-1 py-1 px-2 flex flex-col items-center justify-center bg-[#050505] rounded-lg border border-[#1a1a1a]">
        <svg
          viewBox="0 0 240 148"
          className="w-full h-[175px] text-white max-w-[250px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Locker Body Outer */}
          <rect
            x="8"
            y="6"
            width="224"
            height="136"
            rx="6"
            className="fill-[#141416] stroke-[#333333]"
            strokeWidth="1.5"
          />

          {/* Compartment 1: Camera Viewfinder */}
          <rect
            x="16"
            y="14"
            width="94"
            height="120"
            rx="4"
            className="fill-[#0a0a0c] stroke-[#262626]"
            strokeWidth="1"
          />

          {/* Viewfinder Top Camera Meta */}
          <rect
            x="22"
            y="20"
            width="82"
            height="12"
            rx="2"
            className="fill-[#111114]"
          />
          <circle cx="28" cy="26" r="2" className="fill-red-500" />
          <text x="34" y="29" className="fill-neutral-400 font-mono text-[7px] font-bold">
            REC · 4K
          </text>
          <text x="98" y="29" textAnchor="end" className="fill-emerald-400 font-mono text-[7px]">
            RAW
          </text>

          {/* Viewfinder Target Brackets */}
          <path d="M22 36 H29 M22 36 V43" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M104 36 H97 M104 36 V43" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M22 108 H29 M22 108 V101" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M104 108 H97 M104 108 V101" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />

          {/* Captured Item Silhouette (Keys & Card) */}
          <rect
            x="28"
            y="56"
            width="34"
            height="22"
            rx="2"
            className="fill-neutral-700 stroke-neutral-500"
            strokeWidth="0.8"
          />
          <rect x="33" y="61" width="7" height="6" rx="1" className="fill-amber-400" />
          <line x1="43" y1="63" x2="57" y2="63" stroke="#888" strokeWidth="1" />
          <line x1="43" y1="68" x2="55" y2="68" stroke="#666" strokeWidth="1" />

          {/* Key Ring & Silhouette */}
          <circle cx="84" cy="65" r="6" className="stroke-neutral-400" strokeWidth="1.2" fill="none" />
          <line x1="84" y1="71" x2="84" y2="90" stroke="#999" strokeWidth="2" strokeLinecap="round" />
          <line x1="84" y1="77" x2="89" y2="77" stroke="#999" strokeWidth="1.5" />
          <line x1="84" y1="83" x2="89" y2="83" stroke="#999" strokeWidth="1.5" />

          {/* Reticle Focus Ring & Center */}
          <circle cx="63" cy="72" r="15" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 3" fill="none" />
          <circle cx="63" cy="72" r="2.5" className="fill-red-500" />

          {/* Animated Sweeping Laser Line */}
          <line
            x1="20"
            y1={42 + activeFrame * 15}
            x2="106"
            y2={42 + activeFrame * 15}
            stroke="#ef4444"
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />

          <text x="63" y="123" textAnchor="middle" className="fill-neutral-300 font-mono text-[7.5px] font-medium">
            AF-C · ISO 200 · 35mm
          </text>

          {/* Compartment 2: EXIF Sanitizer & Trait Telemetry */}
          <rect
            x="118"
            y="14"
            width="106"
            height="120"
            rx="4"
            className="fill-[#0e0e10] stroke-[#262626]"
            strokeWidth="1"
          />

          {/* Telemetry Display 1: Privacy Scrub */}
          <rect
            x="124"
            y="20"
            width="94"
            height="20"
            rx="3"
            className="fill-black border border-[#222222]"
          />
          <text
            x="171"
            y="33"
            textAnchor="middle"
            className="fill-emerald-400 font-mono text-[8.5px] font-bold tracking-wider"
          >
            {activeFrame % 2 === 0 ? 'GPS: DELETED [OK]' : 'EXIF: SCRUBBED'}
          </text>

          {/* Trait Parsing Row 1: Item Category (Separate row, zero overlap) */}
          <rect
            x="124"
            y="46"
            width="94"
            height="13"
            rx="2"
            className="fill-[#161619]"
          />
          <text x="129" y="55.5" className="fill-neutral-300 font-mono text-[8px] font-medium">
            ITEM:
          </text>
          <text x="212" y="55.5" textAnchor="end" className="fill-neutral-200 font-mono text-[7px] font-semibold">
            {activeFrame % 2 === 0 ? 'WALLET / KEYS' : 'STUDENT_PASS'}
          </text>

          {/* Trait Parsing Row 2: Intake Speed */}
          <rect
            x="124"
            y="63"
            width="94"
            height="13"
            rx="2"
            className="fill-[#161619]"
          />
          <text x="129" y="72.5" className="fill-neutral-300 font-mono text-[8px] font-medium">
            INTAKE:
          </text>
          <text x="212" y="72.5" textAnchor="end" className="fill-emerald-400 font-mono text-[7px] font-bold">
            &lt; 45 SECONDS
          </text>

          {/* Trait Parsing Row 3: EXIF Leak Sensor */}
          <rect
            x="124"
            y="80"
            width="94"
            height="13"
            rx="2"
            className="fill-[#161619]"
          />
          <text x="129" y="89.5" className="fill-neutral-300 font-mono text-[8px] font-medium">
            EXIF LEAK:
          </text>
          <text x="212" y="89.5" textAnchor="end" className="fill-emerald-400 font-mono text-[7px] font-bold">
            0 BYTES [OK]
          </text>

          {/* Telemetry Indicators and Shutter Button */}
          <circle cx="132" cy="113" r="3" className="fill-emerald-500" />
          <circle cx="143" cy="113" r="3" className="fill-neutral-600" />
          <circle cx="154" cy="113" r="3" className="fill-neutral-600" />
          <rect x="166" y="106" width="48" height="14" rx="2" className="fill-red-500" />
          <text x="190" y="116" textAnchor="middle" fill="#ffffff" className="font-mono text-[7px] font-bold tracking-wider">
            SNAP
          </text>

          <text x="171" y="128" textAnchor="middle" className="fill-neutral-200 font-mono text-[8px] font-semibold">
            DUAL-LAYER SANITIZED
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
        <span className="text-neutral-400 font-medium uppercase">PRIVACY PROTOCOL:</span>
        <span className="font-bold text-white">
          ZERO EXIF (CLIENT+SERVER)
        </span>
      </div>
    </div>
  );
}
