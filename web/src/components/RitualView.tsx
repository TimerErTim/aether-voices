"use client";

import { useMemo, useState } from "react";
import { useTable, useSpacetimeDB, useReducer } from "spacetimedb/react";
import { tables, reducers } from "@/module_bindings";
import type { Message } from "@/module_bindings/types";

export function RitualView() {
  const [sessionRows] = useTable(tables.user_active_session);
  const currentSession = sessionRows?.[0];
  const submitMessageReducer = useReducer(reducers.submitMessage);

  const [input, setInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSend =
    currentSession &&
    !currentSession.isComplete && currentSession.state.tag === "WaitingForInitiator";

  const showWritingIndicator =
    currentSession &&
    !currentSession.isComplete &&
    currentSession.state.tag === "GhostWriting";

  const mergedMessages = useMemo(() => {
    if (!currentSession) return [];
    const ghost = (currentSession.ghostMessages ?? []).map((m: Message) => ({
      ...m,
      type: "ghost" as const,
    }));
    const initiator = (currentSession.initiatorMessages ?? []).map(
      (m: Message) => ({ ...m, type: "initiator" as const })
    );
    const all: Array<Message & { type: "ghost" | "initiator" }> = [];
    const maxLen = Math.max(ghost.length, initiator.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < initiator.length) all.push(initiator[i]);
      if (i < ghost.length) all.push(ghost[i]);
    }
    return all;
  }, [currentSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const t = input.trim();
    if (!t || !canSend) return;
    try {
      await submitMessageReducer({ text: t, location: { tag: "Us" } });
      setInput("");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to send");
    }
  };

  if (!currentSession) {
    return (
      <section className="flex-1 flex items-center justify-center p-6 text-stone-500">
        <p>No active session. Start a ritual from the map.</p>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-h-0 border-t border-stone-700/50">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mergedMessages.map((item) => (
          <div
            key={`${item.type}-${item.messageId}`}
            className={`flex ${item.type === "initiator" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                item.type === "ghost"
                  ? "bg-stone-600/80 text-stone-100 rounded-bl-md"
                  : "bg-amber-900/60 text-amber-100 rounded-br-md"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap wrap-break-word">
                {item.text || "\u00A0"}
              </p>
            </div>
          </div>
        ))}
        {showWritingIndicator && (
          <div className="flex justify-start">
            <div className="bg-stone-600/80 text-stone-300 rounded-2xl rounded-bl-md px-4 py-2 flex items-center gap-1">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" />
              </span>
              <span className="text-sm">Ghost is writing…</span>
            </div>
          </div>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-stone-700/50 bg-stone-900/50"
      >
        {submitError && (
          <p className="text-red-400 text-sm mb-2">{submitError}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              canSend
                ? "Speak to the spirit…"
                : currentSession.isComplete
                  ? "Session ended"
                  : "Wait for the ghost…"
            }
            disabled={!canSend}
            className="flex-1 rounded-xl bg-stone-800 text-stone-100 placeholder-stone-500 border border-stone-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-600/50 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!canSend || !input.trim()}
            className="rounded-xl bg-amber-800 text-amber-100 px-4 py-2.5 font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  );
}
