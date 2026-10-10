// ============================================================================
// storage.rs — Persistent storage helpers for SplitStar
// ============================================================================

use soroban_sdk::{contracttype, Env};

use crate::errors::Error;
use crate::types::Pool;

// ── Keys ─────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug)]
pub enum Key {
    Pool(u64),
    NextId,
    Initialized,
}

// ── TTLs (ledgers) ────────────────────────────────────────────────────────────
// ~17,280 ledgers/day at 5 s/ledger
pub const POOL_TTL: u32 = 12_614_400; // ~2 years
pub const CONFIG_TTL: u32 = 63_072_000; // ~10 years

// ── Helpers ───────────────────────────────────────────────────────────────────

pub fn get_next_id(env: &Env) -> u64 {
    env.storage().persistent().get(&Key::NextId).unwrap_or(0u64)
}

pub fn increment_next_id(env: &Env) {
    let id = get_next_id(env) + 1;
    env.storage().persistent().set(&Key::NextId, &id);
    env.storage()
        .persistent()
        .extend_ttl(&Key::NextId, CONFIG_TTL, CONFIG_TTL);
}

pub fn get_pool(env: &Env, pool_id: u64) -> Result<Pool, Error> {
    env.storage()
        .persistent()
        .get(&Key::Pool(pool_id))
        .ok_or(Error::PoolNotFound)
}

pub fn save_pool(env: &Env, pool_id: u64, pool: &Pool) {
    env.storage().persistent().set(&Key::Pool(pool_id), pool);
    env.storage()
        .persistent()
        .extend_ttl(&Key::Pool(pool_id), POOL_TTL, POOL_TTL);
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&Key::Initialized)
}

pub fn set_initialized(env: &Env) {
    env.storage().instance().set(&Key::Initialized, &true);
    env.storage().instance().extend_ttl(CONFIG_TTL, CONFIG_TTL);
}
