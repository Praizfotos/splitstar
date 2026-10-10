# feat: add withdraw — member can pull back their own deposit before pool locks

**Labels:** `enhancement`, `contract`
**Estimated effort:** Medium (3–5 hours)

---

## Problem

Once a member deposits, they cannot get their money back unless:
1. The owner cancels the entire pool (affects everyone), or
2. The pool is settled

There's no way for a single member to opt out of a pool they joined but changed
their mind about — for example, someone can't make the trip anymore.

---

## Proposed solution

Add:

```rust
pub fn withdraw(env: Env, pool_id: u64, member: Address, amount: i128) -> Result<(), Error>
```

Rules:
- Member calls with `require_auth()`
- Pool must be `Open` (not Locked, Settled, or Cancelled)
- `amount` must be ≤ `member.deposited`
- `amount` must be ≤ `pool.available_balance` (deposited - spent; though in Open
  state no expenses should be approved yet, this is a safety guard)
- Partial withdrawals are allowed (member can withdraw part of their deposit)
- After withdrawal: `member.deposited -= amount`, `pool.total_deposited -= amount`
- If `member.deposited` reaches 0 after withdrawal, member remains in the pool
  (they can deposit again later)

---

## Acceptance criteria

- [ ] New function `withdraw` in `lib.rs`
- [ ] New error `InsufficientMemberBalance = 55` in `errors.rs`
- [ ] Tests:
  - Full withdrawal: member gets all their deposit back; pool total decreases
  - Partial withdrawal: member gets half back; can still deposit again
  - Over-withdrawal rejected: `InsufficientMemberBalance`
  - Withdrawal from Locked pool rejected: `PoolNotOpen`
  - Non-member withdrawal rejected: `NotAMember`
- [ ] State updated BEFORE token transfer (reentrancy pattern)

---

## Files to change

- `contracts/splitstar/src/lib.rs`
- `contracts/splitstar/src/errors.rs`
- `contracts/splitstar/tests/test_pools.rs`
