import { useId } from "react";

export type PatternKind = "tile" | "plank" | "stone" | "mosaic" | "plain";
export interface Finish {
  color: string;
  pattern: PatternKind;
}

/** Aclara (+) u oscurece (-) un color hex. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("")}`;
}

function PatternDef({ id, finish, scale = 1 }: { id: string; finish: Finish; scale?: number }) {
  const { color, pattern } = finish;
  const grout = shade(color, 0.45);
  const dark = shade(color, -0.12);
  const light = shade(color, 0.12);
  if (pattern === "plain") {
    return (
      <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill={color} />
      </pattern>
    );
  }
  if (pattern === "plank") {
    const w = 150 * scale, h = 24 * scale;
    return (
      <pattern id={id} width={w} height={h * 2} patternUnits="userSpaceOnUse">
        <rect width={w} height={h * 2} fill={color} />
        <rect y="0" width={w * 0.6} height={h} fill={light} />
        <rect x={w * 0.4} y={h} width={w * 0.6} height={h} fill={dark} />
        <path d={`M0 ${h}H${w}M0 ${h * 2}H${w}M${w * 0.6} 0V${h}M${w * 0.4} ${h}V${h * 2}`} stroke={shade(color, -0.3)} strokeWidth="1" />
        <path d={`M10 ${h * 0.4}c30 -3 60 3 90 0`} stroke={shade(color, -0.08)} fill="none" />
      </pattern>
    );
  }
  if (pattern === "mosaic") {
    const s = 14 * scale;
    const tones = [color, light, dark, shade(color, 0.05)];
    return (
      <pattern id={id} width={s * 4} height={s * 4} patternUnits="userSpaceOnUse">
        <rect width={s * 4} height={s * 4} fill={grout} />
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={(i % 4) * s + 1} y={Math.floor(i / 4) * s + 1} width={s - 2} height={s - 2} rx="1.5" fill={tones[(i * 7 + Math.floor(i / 4)) % 4]} />
        ))}
      </pattern>
    );
  }
  if (pattern === "stone") {
    const s = 90 * scale;
    return (
      <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">
        <rect width={s} height={s} fill={grout} />
        <path d={`M2 2H${s * 0.55}L${s * 0.5} ${s * 0.45}H2Z`} fill={color} />
        <path d={`M${s * 0.58} 2H${s - 2}V${s * 0.52}H${s * 0.53}Z`} fill={light} />
        <path d={`M2 ${s * 0.48}H${s * 0.48}L${s * 0.42} ${s - 2}H2Z`} fill={dark} />
        <path d={`M${s * 0.51} ${s * 0.55}H${s - 2}V${s - 2}H${s * 0.45}Z`} fill={color} />
        <path d={`M8 ${s * 0.2}C${s * 0.2} ${s * 0.25} ${s * 0.3} ${s * 0.1} ${s * 0.45} ${s * 0.3}`} stroke={dark} fill="none" opacity=".35" />
      </pattern>
    );
  }
  const s = 56 * scale;
  return (
    <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">
      <rect width={s} height={s} fill={grout} />
      <rect x="1.5" y="1.5" width={s - 3} height={s - 3} rx="2" fill={color} />
      <rect x="1.5" y="1.5" width={s - 3} height={(s - 3) / 2} rx="2" fill={light} opacity=".35" />
    </pattern>
  );
}

/**
 * Ambiente ilustrado (living). Recibe la terminación de pared y piso.
 * Se usa en el antes/después de la landing y en el visualizador del widget.
 */
export function RoomScene({ wall, floor, label }: { wall: Finish; floor: Finish; label?: string }) {
  const uid = useId().replace(/:/g, "");
  const w = `w${uid}`, f = `f${uid}`, sh = `s${uid}`;
  return (
    <svg viewBox="0 0 800 500" role="img" aria-label={label ?? "Ambiente con revestimiento"} preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "100%" }}>
      <defs>
        <PatternDef id={w} finish={wall} />
        <PatternDef id={f} finish={floor} scale={1.15} />
        <linearGradient id={sh} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".18" />
          <stop offset=".35" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* techo y paredes laterales */}
      <path d="M0 0H800L680 40H120Z" fill="#f4efe8" />
      <path d="M0 0L120 40V330L0 430Z" fill={`url(#${w})`} />
      <path d="M0 0L120 40V330L0 430Z" fill="#000" opacity=".12" />
      <path d="M800 0L680 40V330L800 430Z" fill={`url(#${w})`} />
      <path d="M800 0L680 40V330L800 430Z" fill="#000" opacity=".2" />
      {/* pared principal */}
      <rect x="120" y="40" width="560" height="290" fill={`url(#${w})`} />
      {/* piso */}
      <path d="M0 430L120 330H680L800 430V500H0Z" fill={`url(#${f})`} />
      <path d="M0 430L120 330H680L800 430V500H0Z" fill={`url(#${sh})`} />
      {/* ventana lateral */}
      <path d="M28 70L92 88V250L28 290Z" fill="#dfe9ee" stroke="#fff" strokeWidth="5" />
      <path d="M60 79V270" stroke="#fff" strokeWidth="3" />
      {/* cuadro */}
      <rect x="330" y="88" width="140" height="96" rx="4" fill="#fffaf3" stroke="#2b2622" strokeWidth="5" />
      <path d="M345 170l35-40 25 25 20-15 30 30z" fill="#b5653b" opacity=".85" />
      <circle cx="440" cy="115" r="10" fill="#e9c27a" />
      {/* lámpara */}
      <path d="M600 330V170" stroke="#2b2622" strokeWidth="4" />
      <path d="M575 175h50l-12-40h-26z" fill="#efe1c8" stroke="#2b2622" strokeWidth="2" />
      <ellipse cx="600" cy="332" rx="22" ry="5" fill="#2b2622" />
      {/* sillón */}
      <ellipse cx="400" cy="398" rx="210" ry="16" fill="#000" opacity=".18" />
      <rect x="215" y="262" width="370" height="70" rx="22" fill="#5c6b52" />
      <rect x="200" y="300" width="400" height="80" rx="24" fill="#6d7d62" />
      <rect x="185" y="285" width="44" height="100" rx="20" fill="#5c6b52" />
      <rect x="571" y="285" width="44" height="100" rx="20" fill="#5c6b52" />
      <rect x="250" y="276" width="90" height="46" rx="14" fill="#e8d6c0" />
      <rect x="460" y="276" width="90" height="46" rx="14" fill="#c98a5f" />
      <path d="M225 380v14M575 380v14" stroke="#2b2622" strokeWidth="6" strokeLinecap="round" />
      {/* planta */}
      <path d="M680 445h44l-6 40h-32z" fill="#c98a5f" />
      <path d="M702 445c-30-40-40-80-18-110M702 445c10-50 30-80 50-90M702 445c-5-60 0-100 10-130M702 445c-40-20-60-40-62-70" stroke="#4d5a41" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* mesa ratona */}
      <rect x="320" y="420" width="160" height="14" rx="7" fill="#2b2622" />
      <path d="M340 434v40M460 434v40" stroke="#2b2622" strokeWidth="6" />
    </svg>
  );
}

export const BEFORE: { wall: Finish; floor: Finish } = {
  wall: { color: "#e6ded3", pattern: "plain" },
  floor: { color: "#b9b2a8", pattern: "plain" },
};
