"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useSpacetimeDB } from "@/context/SpacetimeDBContext";

const TILE = 48;
const PROXIMITY = 120;
const CAMERA_SPEED = 4;

export function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ready, state, startRitual, error } = useSpacetimeDB();
  const [wisp, setWisp] = useState({ x: 400, y: 300 });
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
  const [startButtonError, setStartButtonError] = useState<string | null>(null);
  const [proximityEcho, setProximityEcho] = useState<string | null>(null);

  const moveWisp = useCallback(() => {
    setWisp((prev) => ({
      x: prev.x + (keys.d ? CAMERA_SPEED : 0) - (keys.a ? CAMERA_SPEED : 0),
      y: prev.y + (keys.s ? CAMERA_SPEED : 0) - (keys.w ? CAMERA_SPEED : 0),
    }));
  }, [keys]);

  useEffect(() => {
    const t = setInterval(moveWisp, 16);
    return () => clearInterval(t);
  }, [moveWisp]);

  useEffect(() => {
    let near: string | null = null;
    for (const g of state.gravestones) {
      const dx = g.x * TILE - wisp.x;
      const dy = g.y * TILE - wisp.y;
      if (Math.sqrt(dx * dx + dy * dy) < PROXIMITY) {
        near = g.finalWords;
        break;
      }
    }
    setProximityEcho(near);
  }, [state.gravestones, wisp]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const width = c.width;
    const height = c.height;
    const camX = wisp.x - width / 2;
    const camY = wisp.y - height / 2;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#22c55e";
    ctx.font = "14px monospace";
    for (const g of state.gravestones) {
      const sx = g.x * TILE - camX;
      const sy = g.y * TILE - camY;
      if (sx >= -20 && sy >= -20 && sx <= width + 20 && sy <= height + 20) {
        ctx.fillText("†", sx, sy + 4);
      }
    }
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }, [state.gravestones, wisp]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w") setKeys((p) => ({ ...p, w: true }));
      if (k === "a") setKeys((p) => ({ ...p, a: true }));
      if (k === "s") setKeys((p) => ({ ...p, s: true }));
      if (k === "d") setKeys((p) => ({ ...p, d: true }));
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w") setKeys((p) => ({ ...p, w: false }));
      if (k === "a") setKeys((p) => ({ ...p, a: false }));
      if (k === "s") setKeys((p) => ({ ...p, s: false }));
      if (k === "d") setKeys((p) => ({ ...p, d: false }));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const handleStartRitual = async () => {
    setStartButtonError(null);
    try {
      await startRitual(wisp.x / TILE, wisp.y / TILE);
    } catch (e) {
      setStartButtonError(e instanceof Error ? e.message : "Failed");
    }
  };

  const myRitual = state.activeRituals[0];

  return (
    <section style={{ padding: 8, flex: 1, display: "flex", flexDirection: "column", maxHeight: "50vh" }}>
      {error && <p style={{ color: "#ef4444" }}>{error}</p>}
      {!ready && <p>Connecting...</p>}
      {ready && (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <button type="button" onClick={handleStartRitual} disabled={!!myRitual}>
              Start séance
            </button>
            {startButtonError && <span style={{ color: "#ef4444" }}>{startButtonError}</span>}
            <span style={{ color: "var(--accent)" }}>WASD to move</span>
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            style={{ border: "1px solid var(--fg)", background: "#0a0a0a", width: "100%", maxWidth: 800 }}
          />
          {proximityEcho && (
            <div style={{ marginTop: 8, padding: 8, background: "rgba(34,197,94,0.1)", border: "1px solid var(--fg)", color: "var(--accent)", fontStyle: "italic" }}>
              Ghostly echo: &ldquo;{proximityEcho}&rdquo;
            </div>
          )}
        </>
      )}
    </section>
  );
}
