// ============================================================================
// events.rs — Indexed contract events for SplitStar
// ============================================================================

use soroban_sdk::{symbol_short, Address, Bytes, Env};

pub fn emit_pool_created(
    env: &Env,
    pool_id: u64,
    owner: &Address,
    token: &Address,
    goal: i128,
    name: &Bytes,
) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("created")),
        (pool_id, owner, token, goal, name),
    );
}

pub fn emit_member_joined(env: &Env, pool_id: u64, member: &Address) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("joined")),
        (pool_id, member),
    );
}

pub fn emit_deposited(env: &Env, pool_id: u64, member: &Address, amount: i128, total: i128) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("deposit")),
        (pool_id, member, amount, total),
    );
}

pub fn emit_goal_reached(env: &Env, pool_id: u64, total: i128) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("goal")),
        (pool_id, total),
    );
}

pub fn emit_expense_submitted(
    env: &Env,
    pool_id: u64,
    expense_idx: u32,
    payee: &Address,
    amount: i128,
    description: &Bytes,
) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("expense")),
        (pool_id, expense_idx, payee, amount, description),
    );
}

pub fn emit_expense_approved(
    env: &Env,
    pool_id: u64,
    expense_idx: u32,
    payee: &Address,
    amount: i128,
) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("approved")),
        (pool_id, expense_idx, payee, amount),
    );
}

pub fn emit_pool_locked(env: &Env, pool_id: u64, total: i128) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("locked")),
        (pool_id, total),
    );
}

pub fn emit_pool_settled(env: &Env, pool_id: u64, total_refunded: i128) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("settled")),
        (pool_id, total_refunded),
    );
}

pub fn emit_pool_cancelled(env: &Env, pool_id: u64, total_refunded: i128) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("cancelled")),
        (pool_id, total_refunded),
    );
}

pub fn emit_withdrawn(env: &Env, pool_id: u64, member: &Address, amount: i128) {
    env.events().publish(
        (symbol_short!("split"), symbol_short!("withdraw")),
        (pool_id, member, amount),
    );
}
