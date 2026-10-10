# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ (Testnet only) |

---

## Reporting a vulnerability

**Do not open a public GitHub issue for security bugs.**

Email: `security@splitstar.io`

Please include:

- A description of the vulnerability
- Steps to reproduce or a proof-of-concept
- The impact in terms of funds at risk, if applicable

We will respond within 48 hours and work with you on a coordinated disclosure timeline.

---

## Security model overview

SplitStar custody funds, so the contract is designed around a small number of hard invariants:

### State-before-transfer reentrancy protection

Every function that moves tokens **writes all state changes and saves them before invoking the token client**:

- `deposit` updates `deposited`, `total_deposited`, and status → then transfers in
- `approve_expense` marks the expense approved and bumps `total_spent` → then pays the payee
- `settle_pool` / `cancel_pool` set the terminal status → then loop through refunds

A malicious token contract re-entering SplitStar mid-transfer always observes the *updated* state, so double-withdrawals are impossible. This is layered on top of Soroban's single-execution model.

### `require_auth()` on every mutation

Every balance-changing function calls `require_auth()` on the acting party:

| Function | Auth required |
|---|---|
| `create_pool`, `lock_pool`, `approve_expense`, `settle_pool`, `cancel_pool` | `pool.owner` |
| `join_pool`, `deposit`, `submit_expense` | `member` / `submitted_by` |

Read-only views perform no auth and never mutate state.

### `InsufficientFunds` guard

`approve_expense` recomputes the pool's undisbursed funds on every call:

```
available = total_deposited - total_spent
require(expense.amount <= available)
```

It is impossible for the sum of approved expenses to exceed the sum of deposits.

### Owner cannot redirect payments

The pool owner has administrative power, not custodial power:

- `approve_expense` transfers funds **from the contract directly to `expense.payee`** — the payee was fixed at submission time and cannot be changed
- `settle_pool` refunds each member **by their own deposited share**, not to an arbitrary address
- There is no "sweep to owner" or "withdraw all" function anywhere in the contract

Test coverage: `test_owner_cannot_redirect_expense_to_self` in `tests/test_edge_cases.rs`.

### Hard resource limits

| Limit | Value | Reason |
|---|---|---|
| Members per pool | 20 (`MAX_MEMBERS`) | Keeps `settle_pool` refund loops within budget |
| Expenses per pool | 50 (`MAX_EXPENSES`) | Bounded storage growth |
| Name / description | 64 bytes (`MAX_BYTES`) | Bounded storage |

### Additional guards

- `AlreadyInitialized` — the contract can only be initialised once
- `AlreadyMember` — no duplicate membership or double-counted deposits
- `ExpenseAlreadyApproved` — an expense can only be paid once
- `PoolAlreadySettled` / `PoolCancelled` — terminal states reject all mutations
- All token math in `i128` with `overflow-checks = true` in the release profile
- Explicit TTL extension on every persistent storage write (~2 years for pools, ~10 years for config)

---

## Known limitations

- **Pro-rata rounding dust.** Refunds use floor division (`deposited × remaining / total_deposited`), so up to 1 stroop per member per token can remain in the contract after settlement. This is consistent with Stellar SDEX rounding behaviour and is not recoverable by any party.
- **20-member / 50-expense caps.** These are deliberate gas-safety limits. Larger groups should split across multiple pools. The caps are compile-time constants in `lib.rs` and can be revisited in a future version.
- **Single-owner trust model.** The owner approves expenses. Members must trust the owner to reject fraudulent expenses — SplitStar guarantees funds can only go to a submitted payee, not that the expense is legitimate. A multi-sig or DAO approval model is future work.
- **No member-initiated exit.** Once locked, members cannot unilaterally withdraw their share; they must wait for the owner to `settle_pool` or (if nothing was spent) `cancel_pool`.
- **`cancel_pool` requires `total_spent == 0`.** If even one expense was approved, the owner must use `settle_pool` instead, which refunds pro-rata rather than 100%.
- **Storage TTL expiry.** If a pool's TTL is not extended and the record expires from ledger state, it becomes unrecoverable. All mutating and view paths extend TTL on read-modify-write; a long-dormant pool should be touched periodically by a member or owner.
- **Unaudited.** SplitStar contracts have **not** undergone a third-party audit. Do not use with mainnet funds until an audit is complete — use Testnet only.

---

## Audit status

| Status | Details |
|---|---|
| Third-party audit | ❌ Not yet performed |
| Bug bounty | Not active |
| Recommended network | **Stellar Testnet only** |

We plan to commission an external audit before any mainnet deployment with real funds. If you'd like to help review the contract, please reach out via the contact above.
