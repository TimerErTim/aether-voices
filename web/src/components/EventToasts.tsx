"use client";

import { useState, useEffect } from "react";
import { useSpacetimeDB } from "@/context/SpacetimeDBContext";

export function EventToasts() {
  const { state, identity } = useSpacetimeDB();
  const [finalBreathSeen, setFinalBreathSeen] = useState<Set<bigint>>(new Set());
  const [cancelledSeen, setCancelledSeen] = useState<Set<bigint>>(new Set());
  const [toasts, setToasts] = useState<Array<{ id: string; type: "final" | "cancelled"; text: string }>>([]);

  useEffect(() => {
    for (const ev of state.finalBreathEvents) {
      if (finalBreathSeen.has(ev.id)) continue;
      setFinalBreathSeen((s) => new Set(s).add(ev.id));
      setToasts((t) => [...t, { id: `fb-${ev.id}`, type: "final", text: ev.finalWords }]);
    }
  }, [state.finalBreathEvents, finalBreathSeen]);

  useEffect(() => {
    for (const ev of state.ritualCancelledEvents) {
      if (cancelledSeen.has(ev.id)) continue;
      setCancelledSeen((s) => new Set(s).add(ev.id));
      const isMe = identity && ev.userId.toHexString() === identity;
      setToasts((t) => [
        ...t,
        { id: `rc-${ev.id}`, type: "cancelled", text: isMe ? "Ritual failed — link severed." : "A ritual failed elsewhere." },
      ]);
    }
  }, [state.ritualCancelledEvents, cancelledSeen, identity]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts((prev) => prev.slice(1)), 5000);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: 12,
            background: toast.type === "final" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${toast.type === "final" ? "var(--fg)" : "#ef4444"}`,
            color: "var(--fg)",
          }}
        >
          {toast.type === "final" ? "Final breath: " : ""}&ldquo;{toast.text}&rdquo;
        </div>
      ))}
    </div>
  );
}
