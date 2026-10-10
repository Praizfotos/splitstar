# ⭐ SplitStar

> **Group savings pools and on-chain expense splitting on Stellar Soroban.**
> The Splitwise you use with friends who live in different countries.

[![CI](https://github.com/YOUR_ORG/splitstar/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/splitstar/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## The problem

You're planning a trip to Tokyo with five friends across three countries. You
need to collect funds and split costs.

- **Splitwise** works for IOUs but not for actually moving money internationally
- **Bank transfer** to your Nigerian friend costs $15 and takes 3 days
- **PayPal** charges 4.4% + fixed fee and doesn't work in some countries
- **Venmo / CashApp** — US only

**SplitStar** solves this. Everyone in the pool deposits USDC in seconds from
any Stellar wallet, anywhere in the world. Expenses get logged and paid
directly to the payee on-chain. When the trip ends, the owner settles the
pool and leftover funds go back to each member proportionally.

**Cost per transaction: < $0.0001. Settlement time: ~5 seconds.**

---

## How it works

```
1. Alice creates a pool: "Tokyo Trip 2026", goal: 3,000 USDC
2. Bob (Lagos), Carol (London), Dave (Seoul) join and deposit
3. Goal reached → pool auto-locks
4. Alice submits expense: Hotel Shinjuku, 1,200 USDC → hotel address
5. Alice approves → 1,200 USDC sent instantly to hotel
6. Trip ends → Alice settles → each member gets refund proportional to deposit
```

---

## Project structure

```
splitstar/
├── Cargo.toml
├── contracts/splitstar/
│   ├── src/
│   │   ├── lib.rs       ← Main contract (create, join, deposit, expense, settle)
│   │   ├── types.rs     ← Pool, Member, Expense, PoolStatus structs
│   │   ├── errors.rs    ← 20 typed error codes
│   │   ├── storage.rs   ← Persistent storage + TTL
│   │   └── events.rs    ← 9 indexed contract events
│   └── tests/
│       ├── test_pools.rs       ← 9 pool lifecycle tests
│       ├── test_expenses.rs    ← 8 expense and settlement tests
│       └── test_edge_cases.rs ← 10 security / edge case tests
├── frontend/
│   └── src/
│       ├── app/page.tsx            ← Landing page
│       ├── app/create/page.tsx     ← Create pool form
│       ├── app/dashboard/page.tsx  ← Browse all pools
│       ├── app/pool/[id]/page.tsx  ← Pool detail + actions
│       ├── components/             ← WalletButton, PoolCard
│       ├── hooks/usePool.ts        ← All React Query mutations
│       └── lib/stellar.ts          ← SDK helpers
├── scripts/deploy.sh
└── Makefile
```

---

## Quick start

```bash
# 1. Test the contract
cargo test --all --features testutils

# 2. Deploy to Testnet
make deploy

# 3. Run the frontend
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_CONTRACT_ID from scripts/deployed.testnet.json
npm install && npm run dev
```

---

## Contract API

| Function | Who | Description |
|---|---|---|
| `initialize` | Anyone (once) | One-time setup |
| `create_pool` | Owner | Create pool, lock goal, set max members |
| `join_pool` | Member | Register as a member |
| `deposit` | Member | Add funds to the pool |
| `lock_pool` | Owner | Manually lock (no new deposits) |
| `submit_expense` | Any member | Log an expense for approval |
| `approve_expense` | Owner | Approve & immediately pay payee |
| `settle_pool` | Owner | Refund remainder pro-rata to members |
| `cancel_pool` | Owner | Full refund (before any expense approved) |
| `get_pool` | Anyone | Read full pool data |
| `available_balance` | Anyone | Deposited minus spent |
| `member_balance` | Anyone | What a specific member deposited |
| `goal_progress_pct` | Anyone | 0–100% toward goal |

---

## Security

| Concern | Mitigation |
|---|---|
| Overflow | All math in `i128`; Rust overflow-checks = true |
| Reentrancy | State updated before every `token::transfer` call |
| Drain by owner | `approve_expense` pays `payee` field directly, never owner |
| Double join | `AlreadyMember` guard |
| Overspend | `InsufficientFunds` guard on every `approve_expense` |
| Storage expiry | `extend_ttl` on every write (2-year pool TTL) |
| Auth | `require_auth()` on every state-changing call |

---

## Why this fits Drips Wave

SplitStar is a real open-source Stellar project that solves a problem
**ordinary users face every day**. It has:

- A clean, scoped codebase with well-defined issues contributors can tackle
- Multiple natural extension points (expense categories, recurring deposits,
  mobile UI, multi-token pools, CSV export)
- Zero dependency on any proprietary service
- An audience: anyone who's ever tried to collect money internationally

---

## License

Apache-2.0 — see [LICENSE](LICENSE)
