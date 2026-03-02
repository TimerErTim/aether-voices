"use client";

import { useMemo } from "react";
import { DbConnection } from "@/module_bindings";
import { SpacetimeDBProvider } from "spacetimedb/react";
import { MapView } from "@/components/MapView";
import { RitualView } from "@/components/RitualView";

function AppContent() {
  return (
    <main className="min-h-screen flex flex-col">
      <RitualView />
    </main>
  );
}

export default function Home() {
  const uri = process.env.NEXT_PUBLIC_SPACETIMEDB_URI ?? "http://localhost:3000";
  const dbName = process.env.NEXT_PUBLIC_SPACETIMEDB_MODULE ?? "aether-voices-01";
  var localStorage = typeof window !== "undefined" && window.localStorage ? window.localStorage : null

  const connectionBuilder = useMemo(
    () =>
      DbConnection.builder()
        .withUri(uri)
        .withDatabaseName(dbName)
        .onConnectError((_ctx, err) => {
          console.error("SpacetimeDB connection error:", err);
        })
        .onConnect((conn) => {
          if (typeof conn.token === "string" && localStorage !== null) {
            window.localStorage.setItem("spacetime-token", conn.token);
          }
        })
        .withToken(localStorage !== null ? localStorage.getItem("spacetime-token") ?? undefined : undefined),
    [uri, dbName]
  );

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <AppContent />
    </SpacetimeDBProvider>
  );
}
