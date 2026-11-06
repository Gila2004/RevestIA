import { useEffect, useRef, useState } from "react";
import { BEFORE, RoomScene, type Finish } from "./RoomScene";

/** Comparador antes/después arrastrable. Muestra cómo cambia un ambiente con revestimiento nuevo. */
export function BeforeAfter({ after }: { after: { wall: Finish; floor: Finish } }) {
  const [pos, setPos] = useState(50);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Pequeña animación de entrada para mostrar que se puede arrastrar
  useEffect(() => {
    if (touched) return;
    let t = 0;
    const id = setInterval(() => {
      t += 0.05;
      setPos(50 + Math.sin(t) * 22);
      if (t > Math.PI * 2) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [touched]);

  const move = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      ref={ref}
      className="ba"
      onPointerDown={(e) => {
        setTouched(true);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => e.buttons === 1 && move(e.clientX)}
    >
      <div className="ba-layer">
        <RoomScene {...after} label="Después: con revestimiento nuevo" />
      </div>
      <div className="ba-layer" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <RoomScene {...BEFORE} label="Antes: ambiente original" />
      </div>
      <span className="ba-tag ba-tag-l">Antes</span>
      <span className="ba-tag ba-tag-r">Después</span>
      <div className="ba-handle" style={{ left: `${pos}%` }}>
        <span>⟷</span>
      </div>
      <input
        className="sr-only"
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        aria-label="Comparar antes y después"
        onChange={(e) => {
          setTouched(true);
          setPos(Number(e.target.value));
        }}
      />
    </div>
  );
}
