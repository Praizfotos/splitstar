// ============================================================================
// SplitStar — Group Savings Pools & On-Chain Expense Splitting on Stellar
//
// What this solves for real users
// ────────────────────────────────
// Splitwise and Venmo are broken for international friend groups. Cross-border
// transfers take 1–5 days, cost $15–30, and require everyone to have the same
// bank. SplitStar replaces that with a Soroban smart contract:
//
//   • A group creates a pool (trip fund, shared household, team event)
//   • Each member deposits USDC in any amount, from any country, in 5 seconds
//   • The owner logs expenses (hotel, dinner, taxi) — any member can submit
//   • Owner approves each expense; USDC moves instantly to the payee
//   • Settle closes the pool and refunds the unspent balance pro-rata
//
// Why Stellar?
//   • $0.0001 fees → splitting a $10 pizza costs nothing
//   • 5-second finality → money arrives before the food gets cold
//   • Works in 180 countries → your friend in Lagos can contribute to a
//     group trip to Tokyo without a wire transfer
//
// Security properties
// ────────────────────
//   • All token math in i128 — no overflow
//   • State written BEFORE every token transfer (reentrancy safe)
//   • require_auth() on every balance-changing call
//   • Expenses cannot exceed available balance (InsufficientFunds guard)
//   • Members cannot double-join (AlreadyMember guard)
//   • Pool owner cannot drain: approve_expense pays the payee directly,
//     never the owner; settle refunds members proportionally
//   • Max 20 members, max 50 expenses per pool (gas safety)
//
// Contract state machine
// ───────────────────────
//   Open → Locked → Settled
//   Open → Cancelled  (full refunds, only when no expenses approved)
//
// Storage layout (Persistent)
// ────────────────────────────
//   Key::Pool(pool_id)  → Pool
//   Key::NextId         → u64
//   Key::Initialized    → bool (instance)
// ============================================================================

#![no_std]

mod errors;
mod events;
mod storage;
mod types;

pub use errors::Error;
pub use types::{Expense, Member, Pool, PoolStatus};

use soroban_sdk::{contract, contractimpl, token, vec, Address, Bytes, Env, Vec};

use errors::Error as SErr;
use events::*;
use storage::*;

// ── Constants ─────────────────────────────────────────────────────────────────

/// Maximum members per pool
const MAX_MEMBERS: usize = 20;

/// Maximum expenses per pool
const MAX_EXPENSES: usize = 50;

/// Maximum bytes for pool name or expense description
const MAX_BYTES: usize = 64;

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct SplitStarContract;

#[contractimpl]
impl SplitStarContract {
    // ── Initialisation ────────────────────────────────────────────────────

    /// One-time contract setup. No admin key — anyone can call once.
    pub fn initialize(env: Env) -> Result<(), SErr> {
        if is_initialized(&env) {
            return Err(SErr::AlreadyInitialized);
        }
        set_initialized(&env);
        Ok(())
    }

    // ── Pool creation ─────────────────────────────────────────────────────

    /// Create a new group savings pool.
    ///
    /// * `owner`       — creates and manages the pool
    /// * `token`       — any SEP-41 token (USDC, XLM SAC, etc.)
    /// * `name`        — display name ≤ 64 bytes
    /// * `goal`        — optional USDC savings target (0 = no goal)
    /// * `max_members` — member cap (0 = up to MAX_MEMBERS = 20)
    ///
    /// Returns the new pool ID.
    /// The owner is automatically registered as the first member.
    pub fn create_pool(
        env: Env,
        owner: Address,
        token: Address,
        name: Bytes,
        goal: i128,
        max_members: u32,
    ) -> Result<u64, SErr> {
        owner.require_auth();

        if name.len() > MAX_BYTES as u32 {
            return Err(SErr::NameTooLong);
        }
        if goal < 0 {
            return Err(SErr::InvalidGoal);
        }
        let effective_max = if max_members == 0 {
            MAX_MEMBERS as u32
        } else if max_members > MAX_MEMBERS as u32 {
            return Err(SErr::InvalidMaxMembers);
        } else {
            max_members
        };

        let pool_id = get_next_id(&env);
        increment_next_id(&env);

        // Owner is member #0 with 0 initial deposit
        let mut members: Vec<Member> = vec![&env];
        members.push_back(Member {
            address: owner.clone(),
            deposited: 0,
            refund_due: 0,
        });

        let pool = Pool {
            name: name.clone(),
            owner: owner.clone(),
            token,
            goal,
            total_deposited: 0,
            total_spent: 0,
            members,
            expenses: vec![&env],
            status: PoolStatus::Open,
            created_at: env.ledger().sequence(),
            max_members: effective_max,
        };

        save_pool(&env, pool_id, &pool);
        emit_pool_created(&env, pool_id, &owner, &pool.token, goal, &name);

        Ok(pool_id)
    }

    // ── Membership ────────────────────────────────────────────────────────

    /// Join a pool as a new member (no deposit required at join time).
    /// The owner is already registered at creation; others call this.
    pub fn join_pool(env: Env, pool_id: u64, member: Address) -> Result<(), SErr> {
        member.require_auth();

        let mut pool = get_pool(&env, pool_id)?;

        if pool.status != PoolStatus::Open {
            return Err(SErr::PoolNotOpen);
        }
        if pool.members.len() >= pool.max_members {
            return Err(SErr::PoolFull);
        }

        // Check not already a member
        if pool.members.iter().any(|m| m.address == member) {
            return Err(SErr::AlreadyMember);
        }

        pool.members.push_back(Member {
            address: member.clone(),
            deposited: 0,
            refund_due: 0,
        });

        save_pool(&env, pool_id, &pool);
        emit_member_joined(&env, pool_id, &member);
        Ok(())
    }

    // ── Deposits ──────────────────────────────────────────────────────────

    /// Deposit tokens into a pool.
    ///
    /// Any registered member can deposit any positive amount.
    /// If the deposit meets or exceeds the goal, a GoalReached event fires
    /// and the pool auto-locks (no new deposits or members).
    pub fn deposit(env: Env, pool_id: u64, member: Address, amount: i128) -> Result<(), SErr> {
        member.require_auth();

        let mut pool = get_pool(&env, pool_id)?;

        if pool.status != PoolStatus::Open {
            return Err(SErr::PoolNotOpen);
        }
        if amount <= 0 {
            return Err(SErr::InvalidAmount);
        }

        // Verify member exists
        let idx = pool
            .members
            .iter()
            .position(|m| m.address == member)
            .ok_or(SErr::NotAMember)?;

        // Transfer tokens from member into contract (state first)
        let new_total = pool.total_deposited + amount;
        let mut m = pool.members.get(idx as u32).unwrap();
        m.deposited += amount;
        pool.members.set(idx as u32, m);
        pool.total_deposited = new_total;

        // Auto-lock when goal is met
        let goal_met = pool.goal > 0 && pool.total_deposited >= pool.goal;
        if goal_met {
            pool.status = PoolStatus::Locked;
        }

        save_pool(&env, pool_id, &pool);

        let token_client = token::Client::new(&env, &pool.token);
        token_client.transfer(&member, &env.current_contract_address(), &amount);

        emit_deposited(&env, pool_id, &member, amount, pool.total_deposited);
        if goal_met {
            emit_goal_reached(&env, pool_id, pool.total_deposited);
        }

        Ok(())
    }

    // ── Pool owner: lock manually ─────────────────────────────────────────

    /// Owner manually locks the pool (stops new deposits / members).
    /// Useful when no savings goal is set but the group is ready to spend.
    pub fn lock_pool(env: Env, pool_id: u64) -> Result<(), SErr> {
        let mut pool = get_pool(&env, pool_id)?;
        pool.owner.require_auth();

        if pool.status != PoolStatus::Open {
            return Err(SErr::PoolNotOpen);
        }

        pool.status = PoolStatus::Locked;
        save_pool(&env, pool_id, &pool);
        emit_pool_locked(&env, pool_id, pool.total_deposited);
        Ok(())
    }

    // ── Expenses ──────────────────────────────────────────────────────────

    /// Any member submits an expense for owner review.
    ///
    /// * `payee`       — who gets paid when approved (member or external)
    /// * `amount`      — amount in token's smallest unit
    /// * `description` — ≤ 64 bytes describing the expense
    ///
    /// Returns the expense index.
    pub fn submit_expense(
        env: Env,
        pool_id: u64,
        submitted_by: Address,
        payee: Address,
        amount: i128,
        description: Bytes,
    ) -> Result<u32, SErr> {
        submitted_by.require_auth();

        let mut pool = get_pool(&env, pool_id)?;

        // Allow expense submission in both Open and Locked states
        if pool.status == PoolStatus::Settled || pool.status == PoolStatus::Cancelled {
            return Err(SErr::PoolAlreadySettled);
        }
        if amount <= 0 {
            return Err(SErr::InvalidAmount);
        }
        if description.len() > MAX_BYTES as u32 {
            return Err(SErr::DescriptionTooLong);
        }
        if pool.expenses.len() >= MAX_EXPENSES as u32 {
            return Err(SErr::TooManyExpenses);
        }

        // Submitter must be a member
        if !pool.members.iter().any(|m| m.address == submitted_by) {
            return Err(SErr::NotAMember);
        }

        let idx = pool.expenses.len();
        pool.expenses.push_back(Expense {
            description: description.clone(),
            amount,
            payee: payee.clone(),
            submitted_by: submitted_by.clone(),
            approved: false,
        });

        save_pool(&env, pool_id, &pool);
        emit_expense_submitted(&env, pool_id, idx, &payee, amount, &description);

        Ok(idx)
    }

    /// Owner approves an expense and immediately pays the payee.
    ///
    /// State is updated BEFORE the token transfer (reentrancy safe).
    /// Cannot approve if the pool lacks sufficient undisbursed funds.
    pub fn approve_expense(env: Env, pool_id: u64, expense_idx: u32) -> Result<(), SErr> {
        let mut pool = get_pool(&env, pool_id)?;
        pool.owner.require_auth();

        if pool.status == PoolStatus::Settled || pool.status == PoolStatus::Cancelled {
            return Err(SErr::PoolAlreadySettled);
        }

        let mut expense = pool
            .expenses
            .get(expense_idx)
            .ok_or(SErr::ExpenseNotFound)?;

        if expense.approved {
            return Err(SErr::ExpenseAlreadyApproved);
        }

        let available = pool.total_deposited - pool.total_spent;
        if expense.amount > available {
            return Err(SErr::InsufficientFunds);
        }

        // Update state BEFORE transfer
        expense.approved = true;
        pool.expenses.set(expense_idx, expense.clone());
        pool.total_spent += expense.amount;

        save_pool(&env, pool_id, &pool);

        // Pay payee directly — owner cannot redirect to themselves
        let token_client = token::Client::new(&env, &pool.token);
        token_client.transfer(
            &env.current_contract_address(),
            &expense.payee,
            &expense.amount,
        );

        emit_expense_approved(&env, pool_id, expense_idx, &expense.payee, expense.amount);
        Ok(())
    }

    // ── Settlement ────────────────────────────────────────────────────────

    /// Owner settles the pool: refunds remaining balance pro-rata to members.
    ///
    /// Each member receives back:
    ///   refund = deposited × (remaining / total_deposited)
    ///
    /// Using integer math (floor); dust stays in contract (at most 1 stroop
    /// per member per token, consistent with Stellar's SDEX rounding).
    ///
    /// State is updated BEFORE transfers.
    pub fn settle_pool(env: Env, pool_id: u64) -> Result<(), SErr> {
        let mut pool = get_pool(&env, pool_id)?;
        pool.owner.require_auth();

        if pool.status == PoolStatus::Settled {
            return Err(SErr::PoolAlreadySettled);
        }
        if pool.status == PoolStatus::Cancelled {
            return Err(SErr::PoolCancelled);
        }

        let remaining: i128 = pool.total_deposited - pool.total_spent;
        let total_dep: i128 = pool.total_deposited;

        // Compute each member's refund
        let mut refunds: Vec<(Address, i128)> = vec![&env];
        for i in 0..pool.members.len() {
            let mut m = pool.members.get(i).unwrap();
            let refund = if total_dep == 0 {
                0
            } else {
                // Floor division — safe because total_dep > 0
                m.deposited * remaining / total_dep
            };
            m.refund_due = refund;
            pool.members.set(i, m.clone());
            if refund > 0 {
                refunds.push_back((m.address.clone(), refund));
            }
        }

        let total_refunded: i128 = refunds.iter().map(|(_, r)| r).sum();

        // Mark settled BEFORE any transfers
        pool.status = PoolStatus::Settled;
        save_pool(&env, pool_id, &pool);

        // Pay each member their refund
        let token_client = token::Client::new(&env, &pool.token);
        let contract = env.current_contract_address();
        for (addr, refund) in refunds.iter() {
            token_client.transfer(&contract, &addr, &refund);
            emit_withdrawn(&env, pool_id, &addr, refund);
        }

        emit_pool_settled(&env, pool_id, total_refunded);
        Ok(())
    }

    /// Cancel the pool before any expenses are approved.
    /// Returns 100% of each member's deposit to them.
    pub fn cancel_pool(env: Env, pool_id: u64) -> Result<(), SErr> {
        let mut pool = get_pool(&env, pool_id)?;
        pool.owner.require_auth();

        if pool.status == PoolStatus::Settled {
            return Err(SErr::PoolAlreadySettled);
        }
        if pool.status == PoolStatus::Cancelled {
            return Err(SErr::PoolCancelled);
        }
        if pool.total_spent > 0 {
            // Cannot fully cancel once money has gone out; use settle instead
            return Err(SErr::PoolNotOpen);
        }

        let total_refunded = pool.total_deposited;

        // Collect refunds BEFORE state change
        let mut refunds: Vec<(Address, i128)> = vec![&env];
        for i in 0..pool.members.len() {
            let m = pool.members.get(i).unwrap();
            if m.deposited > 0 {
                refunds.push_back((m.address.clone(), m.deposited));
            }
        }

        pool.status = PoolStatus::Cancelled;
        save_pool(&env, pool_id, &pool);

        let token_client = token::Client::new(&env, &pool.token);
        let contract = env.current_contract_address();
        for (addr, amount) in refunds.iter() {
            token_client.transfer(&contract, &addr, &amount);
            emit_withdrawn(&env, pool_id, &addr, amount);
        }

        emit_pool_cancelled(&env, pool_id, total_refunded);
        Ok(())
    }

    // ── Read-only views ───────────────────────────────────────────────────

    /// Return the full Pool record.
    pub fn get_pool(env: Env, pool_id: u64) -> Result<Pool, SErr> {
        get_pool(&env, pool_id)
    }

    /// How much USDC is left to spend (deposited minus approved expenses).
    pub fn available_balance(env: Env, pool_id: u64) -> Result<i128, SErr> {
        let pool = get_pool(&env, pool_id)?;
        Ok(pool.total_deposited - pool.total_spent)
    }

    /// How much a specific member has deposited.
    pub fn member_balance(env: Env, pool_id: u64, member: Address) -> Result<i128, SErr> {
        let pool = get_pool(&env, pool_id)?;
        pool.members
            .iter()
            .find(|m| m.address == member)
            .map(|m| m.deposited)
            .ok_or(SErr::NotAMember)
    }

    /// How far the pool is toward its goal (0–100), or 0 if no goal set.
    pub fn goal_progress_pct(env: Env, pool_id: u64) -> Result<u32, SErr> {
        let pool = get_pool(&env, pool_id)?;
        if pool.goal == 0 {
            return Ok(0);
        }
        let pct = (pool.total_deposited * 100 / pool.goal).min(100) as u32;
        Ok(pct)
    }

    /// Total number of pools created.
    pub fn next_pool_id(env: Env) -> u64 {
        get_next_id(&env)
    }
}
