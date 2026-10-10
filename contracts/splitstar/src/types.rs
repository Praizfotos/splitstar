// ============================================================================
// types.rs — Core data structures for SplitStar
// ============================================================================

use soroban_sdk::{contracttype, Address, Bytes, Vec};

// ── Pool status ───────────────────────────────────────────────────────────────

/// Lifecycle of a savings/expense pool.
///
///   Open ──► Locked ──► Settled
///      └──► Cancelled  (full refund, only when Open)
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PoolStatus {
    /// Accepting deposits; members can join
    Open,
    /// Goal reached or owner locked it; no new deposits
    Locked,
    /// Expenses settled and remaining balance refunded
    Settled,
    /// Cancelled before any expenses; full refund to all depositors
    Cancelled,
}

/// A single expense logged against the pool.
/// Expenses are tracked for transparency; funds move to `payee` immediately
/// when the expense is approved by the owner.
#[contracttype]
#[derive(Clone, Debug)]
pub struct Expense {
    /// Short description (≤ 64 bytes)
    pub description: Bytes,
    /// Amount in token's smallest unit
    pub amount: i128,
    /// Who receives the payment (could be a member or external merchant)
    pub payee: Address,
    /// Who submitted this expense
    pub submitted_by: Address,
    /// Whether the pool owner has approved it
    pub approved: bool,
}

/// Per-member contribution record.
#[contracttype]
#[derive(Clone, Debug)]
pub struct Member {
    /// Member's Stellar address
    pub address: Address,
    /// Total amount they have deposited into this pool
    pub deposited: i128,
    /// Amount they are owed back after settlement (computed at settle time)
    pub refund_due: i128,
}

/// The top-level pool record stored on-chain.
#[contracttype]
#[derive(Clone, Debug)]
pub struct Pool {
    /// Display name for the pool (≤ 64 bytes)
    pub name: Bytes,
    /// Who created and manages the pool
    pub owner: Address,
    /// SEP-41 token (USDC, XLM SAC, etc.)
    pub token: Address,
    /// Optional savings goal; 0 = no goal
    pub goal: i128,
    /// Total deposited across all members
    pub total_deposited: i128,
    /// Total approved expenses paid out
    pub total_spent: i128,
    /// Registered members (ordered by join time)
    pub members: Vec<Member>,
    /// Log of all expenses (approved and pending)
    pub expenses: Vec<Expense>,
    /// Pool lifecycle status
    pub status: PoolStatus,
    /// Ledger at which this pool was created
    pub created_at: u32,
    /// Max members allowed (0 = unlimited, up to MAX_MEMBERS)
    pub max_members: u32,
}
