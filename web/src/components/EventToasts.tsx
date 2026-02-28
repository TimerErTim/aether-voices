"use client";

import { useState, useEffect, useRef } from "react";
import { useTable, useSpacetimeDB } from "spacetimedb/react";
import { tables } from "@/module_bindings";

type Toast = { id: string; type: "final" | "cancelled"; text: string };

export function EventToasts() {
  const [finalBreathRows] = useTable(tables.final_breath);
  const [ritualCancelledRows] = useTable(tables.ritual_cancelled);
  const { identity } = useSpacetimeDB();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenFinalRef = useRef<Set<bigint>>(new Set());
  const seenCancelledRef = useRef<Set<bigint>>(new Set());

  useEffect(() => {
    for (const row of finalBreathRows) {
      if (seenFinalRef.current.has(row.id)) continue;
      seenFinalRef.current.add(row.id);
      setToasts((t) => [
        ...t,
        { id: `fb-${row.id}`, type: "final", text: row.finalWords },
      ]);
    }
  }, [finalBreathRows]);

  useEffect(() => {
    for (const row of ritualCancelledRows) {
      if (seenCancelledRef.current.has(row.id)) continue;
      seenCancelledRef.current.add(row.id);
      const isMe =
        identity && row.userId.toHexString() === identity.toHexString();
      setToasts((t) => [
        ...t,
        {
          id: `rc-${row.id}`,
          type: "cancelled",
          text: isMe
            ? "Ritual failed — link severed."
            : "A ritual failed elsewhere.",
        },
      ]);
    }
  }, [ritualCancelledRows, identity]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts((prev) => prev.slice(1)), 5000);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 max-w-[360px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-3 py-2 rounded border font-mono text-sm ${
            toast.type === "final"
              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
              : "bg-red-500/15 border-red-500/50 text-red-400"
          }`}
        >
          {toast.type === "final" ? "Final breath: " : ""}&ldquo;{toast.text}&rdquo;
        </div>
      ))}
    </div>
  );
}
