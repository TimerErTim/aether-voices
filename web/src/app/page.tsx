"use client";

import { SpacetimeDBProvider } from "@/context/SpacetimeDBContext";
import { MapView } from "@/components/MapView";
import { RitualView } from "@/components/RitualView";
import { EventToasts } from "@/components/EventToasts";

export default function Home() {
  return (
    <SpacetimeDBProvider>
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <EventToasts />
        <MapView />
        <RitualView />
      </main>
    </SpacetimeDBProvider>
  );
}
