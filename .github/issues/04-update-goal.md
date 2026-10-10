# feat: add update_goal — owner can raise the savings target on an Open pool

**Labels:** `enhancement`, `contract`, `good first issue`
**Estimated effort:** Small (1–2 hours)

---

## Problem

Once a pool's goal is set at creation, it cannot be changed. Groups often
discover mid-collection that costs are higher than expected (flights got more
expensive, added a day to the trip) and need to raise their target.

---

## Proposed solution

```rust
pub fn update_goal(env: Env, pool_id: u64, new_goal: i128) -> Result<(), Error>
```

Rules:
- Only callable by `pool.owner`
- Pool must be `Open`
- `new_goal` must be **greater than** current `pool.goal` (can only raise, not lower)
  — this prevents the owner from auto-triggering a lock by lowering goal below
  current deposits
- `new_goal` must be > 0
- Emit an event: `(symbol_short!("split"), symbol_short!("goalupd"))` with
  `(pool_id, old_goal, new_goal)`

---

## Acceptance criteria

- [ ] `update_goal` function in `lib.rs`
- [ ] New event `emit_goal_updated` in `events.rs`
- [ ] New error `GoalCannotLower = 56` in `errors.rs`
- [ ] Tests:
  - Happy path: goal raised, pool stays Open
  - Rejection: new_goal ≤ current goal
  - Rejection: called on Locked pool
  - Rejection: called by non-owner

---

## Files to change

- `contracts/splitstar/src/lib.rs`
- `contracts/splitstar/src/events.rs`
- `contracts/splitstar/src/errors.rs`
- `contracts/splitstar/tests/test_pools.rs`
