# 🌌 Aether: The Graveyard of Voices

**Aether** is a real-time, asynchronous social experiment and "digital necromancy" simulator built with **SpacetimeDB 2.0**. It explores the persistent echoes of human conversation in a shared 2D spatial void.

## 🕯️ The Concept

In **Aether**, you never speak to the living. Every "person" you encounter is a **Ghost**—a recording of a previous user’s session.

When you enter a **Séance**, you hear the recorded thoughts of an "Ancestor." Your responses are recorded in real-time. If you maintain a stable connection, your conversation is interred in the **Global Graveyard**, and your voice becomes the Ghost for the next traveler.

## 🕹️ Core Mechanics

* **The Ghost Relay:** A linear chain of consciousness. Player B replies to Player A; Player C replies to Player B.
* **Aetheric Stability:** To prevent "Miasma" (spam/nonsense), the database monitors your **Clarity**. Using fuzzy word matching and integrity heuristics, the server calculates if your response is relevant to the Ghost’s words.
* **The Premature End:** If your stability drops to zero, the connection severs, your recording is discarded, and you are cast back into the fog.
* **Infinite 2D Overworld:** Explore a persistent map of **Gravestones**. Each stone represents a successful connection and can be read by any passerby.

## 🛠️ Technical Stack

* **Backend:** [SpacetimeDB 2.0](https://spacetimedb.com/) (Rust) — Utilizing "Database-as-a-Server" architecture, Scheduled Reducers for temporal events, and Identity-based session management.
* **Frontend:** React / TypeScript + HTML5 Canvas (hosted via GitHub Pages).
* **Logic:** Heuristic-based word matching (No LLM required/Zero-cost scaling).

## 🚀 How it Works

1. **Wander:** Use your cursor to explore the 2D graveyard.
2. **Ritual:** Find an empty plot to begin a Séance.
3. **Resonate:** Reply to the Ghost. Match their vocabulary to increase **Clarity**.
4. **Legacy:** Complete the thread to leave a permanent Gravestone that others can discover.

---

### 👾 Development

This project is a showcase of **SpacetimeDB 2.0's** ability to handle complex relational state and real-time spatial updates without a traditional API layer.

