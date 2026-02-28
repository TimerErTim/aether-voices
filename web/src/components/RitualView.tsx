"use client";

import { useState } from "react";
import { useSpacetimeDB } from "@/context/SpacetimeDBContext";

export function RitualView() {
  const { state, submitMessage, identity } = useSpacetimeDB();
  const [input, setInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const myRitual = state.activeRituals.find((r) => r.userId.toHexString() === identity);
  if (!myRitual) return null;

  const ancestorId = myRitual.ancestorThreadId;
  const descendantId = myRitual.descendantThreadId;
  const currentStep = myRitual.currentStep;
  const totalSteps = state.ghostThreads.find((t) => t.threadId === ancestorId)?.totalSteps ?? 5;
  const ancestorMessages = state.ghostMessages.filter((m) => m.threadId === ancestorId).sort((a, b) => a.stepIndex - b.stepIndex);
  const descendantMessages = state.ghostMessages.filter((m) => m.threadId === descendantId).sort((a, b) => a.stepIndex - b.stepIndex);
  const ghostMessageForStep = ancestorMessages.find((m) => m.stepIndex === currentStep);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const t = input.trim();
    if (!t) return;
    try {
      await submitMessage(t);
      setInput("");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed");
    }
  };

  const stability = myRitual.stability;
  const isCritical = stability <= 25;
  const isUnstable = stability <= 50 && !isCritical;

  return (
    <section
      className={isCritical ? "ritual-critical" : isUnstable ? "ritual-unstable" : ""}
      style={{ padding: 16, borderTop: "1px solid var(--fg)", maxHeight: "50vh", overflow: "auto" }}
    >
      <h2 style={{ color: "var(--accent)", marginTop: 0 }}>Séance</h2>
      <div style={{ marginBottom: 8 }}>
        Stability: <strong>{stability}</strong>/100
        <div style={{ width: "100%", height: 8, background: "#1a1a1a", marginTop: 4 }}>
          <div style={{ width: `${stability}%`, height: "100%", background: isCritical ? "#ef4444" : isUnstable ? "#f59e0b" : "#22c55e" }} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        {ancestorMessages.slice(0, currentStep + 1).map((m) => (
          <div key={`a-${m.messageId}`} style={{ color: "var(--accent)", marginBottom: 4 }}>Ghost: &ldquo;{m.text}&rdquo;</div>
        ))}
        {descendantMessages.map((m) => (
          <div key={`d-${m.messageId}`} style={{ color: "var(--fg)", marginBottom: 4 }}>You: &ldquo;{m.text}&rdquo;</div>
        ))}
      </div>
      {ghostMessageForStep && currentStep < totalSteps && (
        <p style={{ color: "var(--accent)", marginBottom: 8 }}>Reply to: &ldquo;{ghostMessageForStep.text}&rdquo;</p>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Your response..." style={{ flex: 1, padding: 8 }} disabled={currentStep >= totalSteps} />
        <button type="submit" disabled={!input.trim() || currentStep >= totalSteps}>Send</button>
      </form>
      {submitError && <p style={{ color: "#ef4444", marginTop: 8 }}>{submitError}</p>}
    </section>
  );
}
