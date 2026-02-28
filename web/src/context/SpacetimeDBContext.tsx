"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DbConnection, tables, type SubscriptionEventContext } from "@/module_bindings";
import type { Gravestone, ActiveRitual, GhostMessage, GhostThread, FinalBreath, RitualCancelled } from "@/module_bindings/types";

type DbState = {
  gravestones: Gravestone[];
  activeRituals: ActiveRitual[];
  ghostMessages: GhostMessage[];
  ghostThreads: GhostThread[];
  finalBreathEvents: FinalBreath[];
  ritualCancelledEvents: RitualCancelled[];
};

type SpacetimeDBContextValue = {
  connection: DbConnection | null;
  identity: string | null;
  ready: boolean;
  error: string | null;
  state: DbState;
  startRitual: (x: number, y: number) => Promise<void>;
  submitMessage: (text: string) => Promise<void>;
};

const initialState: DbState = {
  gravestones: [],
  activeRituals: [],
  ghostMessages: [],
  ghostThreads: [],
  finalBreathEvents: [],
  ritualCancelledEvents: [],
};

const SpacetimeDBContext = createContext<SpacetimeDBContextValue | null>(null);

function collectState(ctx: SubscriptionEventContext): DbState {
  return {
    gravestones: [...ctx.db.gravestone.iter()],
    activeRituals: [...ctx.db.active_ritual.iter()],
    ghostMessages: [...ctx.db.ghost_message.iter()],
    ghostThreads: [...ctx.db.ghost_thread.iter()],
    finalBreathEvents: [...ctx.db.final_breath.iter()],
    ritualCancelledEvents: [...ctx.db.ritual_cancelled.iter()],
  };
}

export function SpacetimeDBProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<DbConnection | null>(null);
  const [identity, setIdentity] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<DbState>(initialState);
  const connRef = useRef<DbConnection | null>(null);

  useEffect(() => {
    const uri = process.env.NEXT_PUBLIC_SPACETIMEDB_URI ?? "http://localhost:3000";
    const moduleName = process.env.NEXT_PUBLIC_SPACETIMEDB_MODULE ?? "aether-voices-01";

    const conn = DbConnection.builder()
      .withUri(uri)
      .withDatabaseName(moduleName)
      .onConnect((conn: DbConnection, identity: { toHexString: () => string }, _token: string) => {
        setConnection(conn);
        connRef.current = conn;
        setIdentity(identity.toHexString());
        setError(null);
        const sub = conn
          .subscriptionBuilder()
          .onApplied((ctx) => {
            setState(collectState(ctx));
            setReady(true);
            const refresh = () => setState(collectState(ctx));
            ctx.db.gravestone.onInsert(refresh);
            ctx.db.active_ritual.onInsert(refresh);
            ctx.db.active_ritual.onUpdate(refresh);
            ctx.db.active_ritual.onDelete(refresh);
            ctx.db.ghost_message.onInsert(refresh);
            ctx.db.final_breath.onInsert(refresh);
            ctx.db.ritual_cancelled.onInsert(refresh);
          })
          .subscribe([
            tables.gravestone,
            tables.active_ritual,
            tables.ghost_message,
            tables.ghost_thread,
            tables.final_breath,
            tables.ritual_cancelled,
          ]);
      })
      .onConnectError((_ctx: unknown, err: Error) => {
        setError(err?.message ?? "Connection failed");
        setReady(false);
      })
      .onDisconnect(() => {
        setReady(false);
      })
      .build();

    return () => {
      connRef.current = null;
      setConnection(null);
      setReady(false);
    };
  }, []);

  const startRitual = useCallback(async (x: number, y: number) => {
    const c = connRef.current;
    if (!c) return;
    const r = (c as unknown as { reducers: { start_ritual: (x: number, y: number) => Promise<unknown> } }).reducers;
    if (r?.start_ritual) await r.start_ritual(x, y);
  }, []);

  const submitMessage = useCallback(async (text: string) => {
    const c = connRef.current;
    if (!c) return;
    const r = (c as unknown as { reducers: { submit_message: (text: string) => Promise<unknown> } }).reducers;
    if (r?.submit_message) await r.submit_message(text);
  }, []);

  const value: SpacetimeDBContextValue = {
    connection,
    identity,
    ready,
    error,
    state,
    startRitual,
    submitMessage,
  };

  return (
    <SpacetimeDBContext.Provider value={value}>{children}</SpacetimeDBContext.Provider>
  );
}

export function useSpacetimeDB(): SpacetimeDBContextValue {
  const ctx = useContext(SpacetimeDBContext);
  if (!ctx) throw new Error("useSpacetimeDB must be used within SpacetimeDBProvider");
  return ctx;
}
