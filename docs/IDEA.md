This document is optimized for a coding agent (like Cursor or Windsurf) to implement the **Aether: The Graveyard of Voices** project. It combines the asynchronous "ghost relay" logic, the 2D spatial environment, and the stability-based game mechanics.

---

# 📜 Project Specification: Aether & The Graveyard of Voices

## 1. Concept Summary

An anonymous, real-time social experiment where users explore a 2D graveyard to "reanimate" the voices of the past. Users interact with "Ghosts" (recordings of previous players). To maintain the connection, the user must provide relevant, coherent responses. Successful conversations leave permanent monuments (Gravestones) on a shared 2D map.

---

## 2. The "Ghost Relay" Logic (The Core Fix)

The system functions as a linear chain of communication.

* **Player A** talks to the "First Ghost" (System-seeded). Player A's responses are recorded as **Thread A**.
* **Player B** enters a séance. They hear **Thread A** (the responses of Player A). Player B's replies to those messages are recorded as **Thread B**.
* **Player C** enters and hears **Thread B**.
* **The Result:** Every conversation is a direct response to a previous human’s thoughts, creating a "Broken Telephone" effect through time.

---

## 3. Database Schema (SpacetimeDB / Rust)

```rust
use spacetimedb::{spacetimedb, Identity, Timestamp};

#[spacetimedb(table)]
pub struct GhostThread {
    #[primarykey] pub thread_id: u64,
    pub is_complete: bool, // Only completed rituals become future ghosts
    pub total_steps: u32,
}

#[spacetimedb(table)]
pub struct GhostMessage {
    #[primarykey] pub message_id: u64,
    pub thread_id: u64,
    pub step_index: u32, // The order in the conversation
    pub text: String,
}

#[spacetimedb(table)]
pub struct Gravestone {
    #[primarykey] pub thread_id: u64,
    pub x: f32,
    pub y: f32,
    pub final_words: String,
    pub clarity_score: u32,
}

#[spacetimedb(table)]
pub struct ActiveRitual {
    #[primarykey] pub user_id: Identity,
    pub ancestor_thread_id: u64,
    pub descendant_thread_id: u64, // The thread being recorded
    pub current_step: u32,
    pub stability: i32, // Starts at 100
    pub x: f32,
    pub y: f32,
}

```

---

## 4. The "Aetheric Stability" Heuristic

To prevent spam/nonsense and ensure "Aetheric Link" quality, every `submit_message` reducer must run this logic:

1. **Passive Decay:** Deduct **15-20 points** from Stability every turn.
2. **Integrity Check (Gibberish):** * If a word has >5 consecutive consonants or is >15 chars without vowels, flag as "Miasma."
* Penalty: **-20 points** per Miasma word.


3. **Relevance Check (Fuzzy Matching):**
* Split the current Ghost message and User response into words.
* Use a simple **Levenshtein distance** or **Stem-matching** (check if first 4 letters match).
* Bonus: **+10 points** per matching word.


4. **Threshold:** * If `Stability <= 0`: Ritual fails. Delete `ActiveRitual`. Do **not** save `descendant_thread`.
* If `Step == Total_Steps`: Ritual succeeds. Set `is_complete = true` on `descendant_thread` and spawn `Gravestone`.



---

## 5. 2D Spatial & UI Requirements

* **The Overworld:** A 2D infinite canvas (use HTML5 Canvas or PixiJS).
* **Exploration:** Users move a "Wisp" (cursor). Gravestones are rendered at their $(x, y)$ coordinates.
* **Proximity Chat:** When a user is near a Gravestone, show a "Ghostly Echo" (the `final_words` of that thread) floating in the air.
* **UI Aesthetic:** * **The Séance Window:** High-contrast terminal style (Green/Amber on Black).
* **Visual Feedback:** As Stability drops, the UI should flicker and use CSS `blur` or `skew` to simulate a "weakening signal."



---

## 6. Implementation Checklist for Agent

* [ ] **Step 1:** Initialize SpacetimeDB module with the 4 tables above.
* [ ] **Step 2:** Write an `init` reducer to seed "Thread 0" with 5-10 poetic messages (The First Ghost).
* [ ] **Step 3:** Implement `start_ritual(x, y)`: Finds a random `is_complete` thread and creates an `ActiveRitual`.
* [ ] **Step 4:** Implement `submit_message(text)`: Contains the Stability/Clarity scoring and handles the premature exit logic.
* [ ] **Step 5:** Create a frontend "Map View" that subscribes to the `Gravestone` table and a "Ritual View" for the chat interaction.
* [ ] **Step 6:** Add a "Final Breath" event: A `spacetimedb` reducer that broadcasts the final message of a successful ritual to all connected clients.