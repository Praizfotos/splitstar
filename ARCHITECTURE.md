# SplitStar — Architecture

## Overview

SplitStar is a single Soroban smart contract on Stellar that lets a group of
people pool USDC, log expenses, and settle up — no bank, no middleman, no fees.

The contract stores every pool, every member, and every expense on-chain in
Stellar's Persistent storage. The frontend reads that state by simulating
read-only contract calls (no wallet needed to view) and writes it by building,
signing, and submitting transactions via Freighter.

---

## Contract state machines

### Pool lifecycle

```
                  create_pool()
                       │
                       ▼
              ┌────────────────┐
              │      Open      │ ◄─── members join, deposits accepted
              └────────┬───────┘
                       │
           ┌───────────┴────────────┐
           │                        │
    goal reached               lock_pool()
    (auto-lock)                 (manual)
           │                        │
           └───────────┬────────────┘
                       ▼
              ┌────────────────┐
              │     Locked     │ ◄─── no new deposits, expenses processed
              └────────┬───────┘
                       │
                  settle_pool()
                       │
                       ▼
              ┌────────────────┐
              │    Settled     │  (terminal — refunds sent)
              └────────────────┘

  From Open or Locked (if total_spent == 0):
              cancel_pool()
                    │
                    ▼
           ┌─────────────────┐
           │   Cancelled     │  (terminal — full refunds sent)
           └─────────────────┘
```

### Expense lifecycle

```
  submit_expense()
        │
        ▼
  ┌───────────┐
  │  Pending  │ ◄─── stored in pool.expenses[], approved = false
  └─────┬─────┘
        │
  approve_expense()       (called by pool owner)
        │
        ▼
  ┌───────────┐
  │ Approved  │  ──── token transfer to payee fires immediately
  └───────────┘        (state updated BEFORE transfer — reentrancy safe)
```

---

## Storage layout

All data lives in **Persistent storage** (survives ledger expiry up to TTL).

```
Key::Pool(pool_id: u64)   →  Pool struct
Key::NextId               →  u64  (auto-increment counter)
Key::Initialized          →  bool (instance storage)
```

TTLs:
- Pools: `POOL_TTL = 12,614,400 ledgers` ≈ 2 years at 5 s/ledger
- Config: `CONFIG_TTL = 63,072,000 ledgers` ≈ 10 years

Every write calls `extend_ttl()` to push the TTL forward. Pools never expire
silently while they have unspent funds.

---

## Pool struct (on-chain)

```
Pool {
    name:             Bytes       ≤ 64 bytes display name
    owner:            Address     creates & manages the pool
    token:            Address     SEP-41 token (USDC, XLM SAC, etc.)
    goal:             i128        optional savings target (0 = none)
    total_deposited:  i128        sum of all member deposits
    total_spent:      i128        sum of all approved expenses
    members:          Vec<Member> ≤ 20 members
    expenses:         Vec<Expense>≤ 50 expenses
    status:           PoolStatus  Open | Locked | Settled | Cancelled
    created_at:       u32         ledger sequence at creation
    max_members:      u32         member cap
}

Member { address, deposited, refund_due }
Expense { description, amount, payee, submitted_by, approved }
```

---

## Settlement math

When `settle_pool()` is called, each member's refund is:

```
refund_i = floor( deposited_i × remaining / total_deposited )

where remaining = total_deposited - total_spent
```

Using integer (floor) division. At most 1 stroop of dust per member stays in
the contract — this is consistent with how Stellar's SDEX handles rounding.
The dust is not recoverable (it is effectively burned).

**Example:**
```
total_deposited = 3,000 USDC
total_spent     = 1,200 USDC  (hotel approved)
remaining       = 1,800 USDC

alice deposited 1,000 → refund = floor(1,000 × 1,800 / 3,000) = 600
bob   deposited 1,000 → refund = 600
carol deposited 1,000 → refund = 600
total refunded = 1,800 ✓  (exact in this case)
```

---

## Security properties

| Property | How it is enforced |
|---|---|
| No overflow | All amounts `i128`; `overflow-checks = true` in release profile |
| Reentrancy safe | Storage written **before** every `token::transfer` call |
| Owner cannot drain | `approve_expense` transfers to `expense.payee`, never to `owner` |
| Double-join | `AlreadyMember` guard scans `pool.members` |
| Over-spend | `InsufficientFunds` guard: `expense.amount > available` → error |
| Auth on mutations | Every state-changing function calls `address.require_auth()` |
| Storage expiry | `extend_ttl` called on every `save_pool` |
| Pool size limits | `MAX_MEMBERS = 20`, `MAX_EXPENSES = 50` (keep tx within CPU budget) |

---

## Frontend ↔ contract interaction

```
User Action          Frontend                  Contract
────────────         ────────────────────      ──────────────────
View pool       ──►  simulate get_pool()   ──► read storage (no auth)
Create pool     ──►  build tx              ──► create_pool()
                     sign (Freighter)           transfer tokens in
                     submit + poll
Deposit         ──►  build tx              ──► deposit()
                     sign                       transfer tokens in
Approve expense ──►  build tx (owner)      ──► approve_expense()
                     sign                       transfer tokens to payee
Settle          ──►  build tx (owner)      ──► settle_pool()
                     sign                       transfer refunds out
```

Read-only calls (simulate only, no wallet):
- `get_pool`, `available_balance`, `member_balance`, `goal_progress_pct`,
  `next_pool_id`

---

## Directory structure

```
splitstar/
├── Cargo.toml                         workspace
├── contracts/splitstar/
│   ├── Cargo.toml                     cdylib + rlib, testutils feature
│   └── src/
│       ├── lib.rs       ← contract entry points (~280 lines)
│       ├── types.rs     ← Pool, Member, Expense, PoolStatus
│       ├── errors.rs    ← 20 typed error codes (stable u32 repr)
│       ├── storage.rs   ← Key enum, TTL constants, CRUD helpers
│       └── events.rs    ← 9 indexed contract events
│   └── tests/
│       ├── test_pools.rs        9 tests
│       ├── test_expenses.rs     8 tests
│       └── test_edge_cases.rs  10 tests
├── frontend/
│   └── src/
│       ├── app/                 Next.js App Router pages
│       ├── components/          WalletButton, PoolCard, forms
│       ├── hooks/usePool.ts     React Query mutations & queries
│       └── lib/stellar.ts       SDK helpers, tx builder, formatter
├── scripts/
│   └── deploy.sh                one-command testnet deploy
└── Makefile                     build / test / deploy shortcuts
```
