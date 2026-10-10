# feat: add remove_member — owner can remove a non-depositing member before lock

**Labels:** `enhancement`, `contract`, `good first issue`
**Estimated effort:** Small–Medium (2–4 hours)

---

## Problem

Once someone joins a pool they cannot be removed, even if they:
- Joined by accident
- Never plan to deposit
- Are blocking the `max_members` cap

The owner has no recourse until they cancel the entire pool.

---

## Proposed solution

Add a new contract function:

```rust
pub fn remove_member(env: Env, pool_id: u64, member: Address) -> Result<(), Error>
```

Rules:
- Only callable by `pool.owner`
- Pool must be `Open` (cannot remove from Locked/Settled/Cancelled)
- Target member must have `deposited == 0` — if they've deposited, reject with a
  new error `MemberHasDeposited` (cannot remove without a refund path)
- Owner cannot remove themselves
- Remove the member from `pool.members` Vec

---

## Acceptance criteria

- [ ] New function `remove_member` added to `lib.rs`
- [ ] New error code `MemberHasDeposited = 33` added to `errors.rs`
- [ ] Tests:
  - Happy path: owner removes a zero-deposit member; member no longer in pool
  - Rejection: owner tries to remove member who deposited; gets `MemberHasDeposited`
  - Rejection: non-owner calls `remove_member`; gets `Unauthorized`
  - Rejection: called on Locked pool; gets `PoolNotOpen`

---

## Files to change

- `contracts/splitstar/src/lib.rs`
- `contracts/splitstar/src/errors.rs`
- `contracts/splitstar/tests/test_pools.rs`
