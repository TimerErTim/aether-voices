"use client";

import { useState } from "react";
import { useTable, useSpacetimeDB, useReducer } from "spacetimedb/react";
import { tables, reducers } from "@/module_bindings";

export function RitualView() {
  const [activeRituals] = useTable(tables.active_ritual);
  const [ghostMessages] = useTable(tables.ghost_message);
  const [ghostThreads] = useTable(tables.ghost_thread);
  const { identity } = useSpacetimeDB();
  const submitMessageReducer = useReducer(reducers.submitMessage);

  const [input, setInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const myRitual = identity
    ? activeRituals.find((r) => r.userId.toHexString() === identity.toHexString())
    : null;

  if (!myRitual) return null;

  const ancestorId = myRitual.ancestorThreadId;
  const descendantId = myRitual.descendantThreadId;
  const currentStep = myRitual.currentStep;
  const totalSteps =
    ghostThreads.find((t) => t.threadId === ancestorId)?.totalSteps ?? 5;
  const ancestorMessages = ghostMessages
    .filter((m) => m.threadId === ancestorId)
    .sort((a, b) => a.stepIndex - b.stepIndex);
  const descendantMessages = ghostMessages
    .filter((m) => m.threadId === descendantId)
    .sort((a, b) => a.stepIndex - b.stepIndex);
  const ghostMessageForStep = ancestorMessages.find(
    (m) => m.stepIndex === currentStep
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const t = input.trim();
    if (!t) return;
    try {
      await submitMessageReducer({ text: t });
      setInput("");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to send");
    }
  };

  const stability = myRitual.stability;
  const isCritical = stability <= 25;
  const isUnstable = stability <= 50 && !isCritical;

  return (
    <section
      className={`border-t border-emerald-500/50 p-4 max-h-[50vh] overflow-auto ${
        isCritical ? "ritual-critical" : isUnstable ? "ritual-unstable" : ""
      }`}
    >
      <h2 className="text-amber-400 font-mono text-lg mt-0 mb-3">Séance</h2>
      <div className="mb-4">
        <span className="text-emerald-400/90 text-sm">
          Stability: <strong>{stability}</strong>/100
        </span>
        <div className="w-full h-2 bg-black/40 rounded mt-1 overflow-hidden">
          <div
            className="h-full rounded transition-all"
            style={{
              width: `${stability}%`,
              backgroundColor: isCritical
                ? "#ef4444"
                : isUnstable
                  ? "#f59e0b"
                  : "#22c55e",
            }}
          />
        </div>
      </div>
      <div className="mb-4 space-y-1 text-sm">
        {ancestorMessages.slice(0, currentStep + 1).map((m) => (
          <div
            key={`a-${m.messageId}`}
            className="text-amber-400/90"
          >
            Ghost: &ldquo;{m.text}&rdquo;
          </div>
        ))}
        {descendantMessages.map((m) => (
          <div key={`d-${m.messageId}`} className="text-emerald-400/90">
            You: &ldquo;{m.text}&rdquo;
          </div>
        ))}
      </div>
      {ghostMessageForStep && currentStep < totalSteps && (
        <p className="text-amber-400/90 text-sm mb-3">
          Reply to: &ldquo;{ghostMessageForStep.text}&rdquo;
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 items-center flex-wrap"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Your response…"
          disabled={currentStep >= totalSteps}
          className="flex-1 min-w-[120px] px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 rounded font-mono text-sm placeholder-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || currentStep >= totalSteps}
          className="px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 rounded font-mono text-sm hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
      {submitError && (
        <p className="text-red-500 text-sm mt-2">{submitError}</p>
      )}
    </section>
  );
}
