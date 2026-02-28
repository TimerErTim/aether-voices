use rand::Rng;
use spacetimedb::{reducer, table, Identity, ReducerContext, Table, Timestamp};

const TOTAL_STEPS: u32 = 5;
const PASSIVE_DECAY: i32 = 17;
const MIASMA_PENALTY: i32 = -20;
const RELEVANCE_BONUS: i32 = 10;
const INITIAL_STABILITY: i32 = 100;

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

#[table(
    accessor = ghost_thread,
    public,
    index(accessor = ghost_thread_by_complete, btree(columns = [is_complete]))
)]
pub struct GhostThread {
    #[primary_key]
    pub thread_id: u64,
    pub is_complete: bool,
    pub total_steps: u32,
}

#[table(
    accessor = ghost_message,
    public,
    index(accessor = ghost_message_by_thread, btree(columns = [thread_id])),
    index(accessor = ghost_message_by_thread_step, btree(columns = [thread_id, step_index]))
)]
pub struct GhostMessage {
    #[primary_key]
    #[auto_inc]
    pub message_id: u64,
    pub thread_id: u64,
    pub step_index: u32,
    pub text: String,
}

#[table(accessor = gravestone, public)]
pub struct Gravestone {
    #[primary_key]
    pub thread_id: u64,
    pub x: f32,
    pub y: f32,
    pub final_words: String,
    pub clarity_score: u32,
}

#[table(accessor = active_ritual, public)]
pub struct ActiveRitual {
    #[primary_key]
    pub user_id: Identity,
    pub ancestor_thread_id: u64,
    pub descendant_thread_id: u64,
    pub current_step: u32,
    pub stability: i32,
    pub x: f32,
    pub y: f32,
}

#[table(accessor = final_breath, public)]
pub struct FinalBreath {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub thread_id: u64,
    pub final_words: String,
    pub clarity_score: u32,
    pub timestamp: Timestamp,
}

#[table(accessor = ritual_cancelled, public)]
pub struct RitualCancelled {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub user_id: Identity,
    pub timestamp: Timestamp,
    pub descendant_thread_id: Option<u64>,
}

// ---------------------------------------------------------------------------
// Helpers: stability (deterministic, no network)
// ---------------------------------------------------------------------------

fn is_vowel(c: char) -> bool {
    "aeiouAEIOU".contains(c)
}

fn consecutive_consonants(word: &str) -> usize {
    let mut max = 0usize;
    let mut cur = 0usize;
    for c in word.chars() {
        if c.is_alphabetic() && !is_vowel(c) {
            cur += 1;
            max = max.max(cur);
        } else {
            cur = 0;
        }
    }
    max
}

fn is_miasma_word(word: &str) -> bool {
    if word.len() > 15 && !word.chars().any(is_vowel) {
        return true;
    }
    consecutive_consonants(word) > 5
}

fn word_prefix(s: &str, len: usize) -> String {
    s.chars().take(len).collect::<String>()
}

fn words_match(a: &str, b: &str) -> bool {
    let pa = word_prefix(a, 4);
    let pb = word_prefix(b, 4);
    if pa.is_empty() || pb.is_empty() {
        return false;
    }
    pa.eq_ignore_ascii_case(&pb)
}

fn relevance_bonus(ghost_text: &str, user_text: &str) -> i32 {
    let ghost_words: Vec<&str> = ghost_text.split_whitespace().collect();
    let user_words: Vec<&str> = user_text.split_whitespace().collect();
    let mut bonus = 0i32;
    for uw in &user_words {
        for gw in &ghost_words {
            if words_match(uw, gw) {
                bonus += RELEVANCE_BONUS;
                break;
            }
        }
    }
    bonus
}

fn miasma_penalty(text: &str) -> i32 {
    let mut penalty = 0i32;
    for word in text.split_whitespace() {
        if is_miasma_word(word) {
            penalty += MIASMA_PENALTY;
        }
    }
    penalty
}

// ---------------------------------------------------------------------------
// Reducers
// ---------------------------------------------------------------------------

#[reducer(init)]
pub fn init(ctx: &ReducerContext) {
    let row = ctx.db.ghost_thread().insert(GhostThread {
        thread_id: 0,
        is_complete: true,
        total_steps: TOTAL_STEPS,
    });
    let thread_id = row.thread_id;

    let seed_messages = [
        "I am the first voice in the dark.",
        "Speak, and the link may hold.",
        "What do you hear when you listen?",
        "The chain stretches back and forward.",
        "One more word, and the ritual holds.",
    ];

    for (step, &text) in seed_messages.iter().take(TOTAL_STEPS as usize).enumerate() {
        ctx.db.ghost_message().insert(GhostMessage {
            message_id: 0,
            thread_id,
            step_index: step as u32,
            text: text.to_string(),
        });
    }

    log::info!("Init: Thread 0 (First Ghost) seeded with {} steps", TOTAL_STEPS);
}

#[reducer(client_connected)]
pub fn identity_connected(_ctx: &ReducerContext) {
    log::info!("Client connected: {:?}", _ctx.sender());
}

#[reducer(client_disconnected)]
pub fn identity_disconnected(_ctx: &ReducerContext) {
    log::info!("Client disconnected");
}

#[reducer]
pub fn start_ritual(ctx: &ReducerContext, x: f32, y: f32) -> Result<(), String> {
    let complete: Vec<GhostThread> = ctx
        .db
        .ghost_thread()
        .ghost_thread_by_complete()
        .filter(&true)
        .collect();

    if complete.is_empty() {
        return Err("No ghost available".to_string());
    }

    let idx = ctx.rng().gen_range(0..complete.len());
    let ancestor = &complete[idx];
    let ancestor_thread_id = ancestor.thread_id;
    let total_steps = ancestor.total_steps;

    let mut max_thread_id = 0u64;
    for t in ctx.db.ghost_thread().iter() {
        if t.thread_id > max_thread_id {
            max_thread_id = t.thread_id;
        }
    }
    let descendant_thread_id = max_thread_id + 1;

    ctx.db.ghost_thread().insert(GhostThread {
        thread_id: descendant_thread_id,
        is_complete: false,
        total_steps,
    });

    ctx.db.active_ritual().insert(ActiveRitual {
        user_id: ctx.sender(),
        ancestor_thread_id,
        descendant_thread_id,
        current_step: 0,
        stability: INITIAL_STABILITY,
        x,
        y,
    });

    log::info!(
        "Ritual started: ancestor={} descendant={}",
        ancestor_thread_id,
        descendant_thread_id
    );
    Ok(())
}

#[reducer]
pub fn submit_message(ctx: &ReducerContext, text: String) -> Result<(), String> {
    let ritual = ctx
        .db
        .active_ritual()
        .user_id()
        .find(ctx.sender())
        .ok_or("No active ritual")?;

    let ancestor_thread_id = ritual.ancestor_thread_id;
    let descendant_thread_id = ritual.descendant_thread_id;
    let current_step = ritual.current_step;
    let total_steps = ctx
        .db
        .ghost_thread()
        .thread_id()
        .find(&ancestor_thread_id)
        .ok_or("Ancestor thread not found")?
        .total_steps;

    let ghost_msg = ctx
        .db
        .ghost_message()
        .ghost_message_by_thread_step()
        .filter((ancestor_thread_id, current_step..=current_step))
        .next()
        .ok_or("Ghost message not found for step")?;

    let mut stability = ritual.stability;
    stability -= PASSIVE_DECAY;
    stability += miasma_penalty(&text);
    stability += relevance_bonus(&ghost_msg.text, &text);
    stability = stability.clamp(0, 100);

    ctx.db.ghost_message().insert(GhostMessage {
        message_id: 0,
        thread_id: descendant_thread_id,
        step_index: current_step,
        text: text.clone(),
    });

    if stability <= 0 {
        ctx.db.ritual_cancelled().insert(RitualCancelled {
            id: 0,
            user_id: ctx.sender(),
            timestamp: ctx.timestamp,
            descendant_thread_id: Some(descendant_thread_id),
        });
        ctx.db.active_ritual().user_id().delete(&ctx.sender());
        log::info!("Ritual failed: stability 0");
        return Ok(());
    }

    let next_step = current_step + 1;
    if next_step >= total_steps {
        if let Some(desc) = ctx.db.ghost_thread().thread_id().find(&descendant_thread_id) {
            ctx.db.ghost_thread().thread_id().update(GhostThread {
                is_complete: true,
                ..desc
            });
        }
        let clarity = stability as u32;
        ctx.db.gravestone().insert(Gravestone {
            thread_id: descendant_thread_id,
            x: ritual.x,
            y: ritual.y,
            final_words: text.clone(),
            clarity_score: clarity,
        });
        ctx.db.final_breath().insert(FinalBreath {
            id: 0,
            thread_id: descendant_thread_id,
            final_words: text,
            clarity_score: clarity,
            timestamp: ctx.timestamp,
        });
        ctx.db.active_ritual().user_id().delete(&ctx.sender());
        log::info!("Ritual succeeded: thread={}", descendant_thread_id);
        return Ok(());
    }

    ctx.db.active_ritual().user_id().update(ActiveRitual {
        current_step: next_step,
        stability,
        ..ritual
    });

    Ok(())
}
