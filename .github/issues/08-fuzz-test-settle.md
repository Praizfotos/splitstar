# test: property-based fuzz test for settle_pool settlement math

**Labels:** `testing`, `contract`
**Estimated effort:** Medium (3–5 hours)

---

## Problem

The settlement math (`refund_i = floor(deposited_i × remaining / total_deposited)`)
has been tested with specific values, but not with arbitrary inputs. Edge cases
like all-equal deposits, one member depositing everything, or `remaining == 0`
should be covered by a property test that proves the invariant holds for any
valid input.

---

## The invariant to prove

For any pool configuration, after `settle_pool`:

```
sum(all member refunds) <= remaining
sum(all member refunds) >= remaining - member_count  (at most 1 stroop lost per member)
```

---

## Acceptance criteria

- [ ] A new test file `contracts/splitstar/tests/test_fuzz.rs` (or added to `test_expenses.rs`)
- [ ] Uses Soroban SDK's existing test harness (no external crate needed)
- [ ] Runs at least 100 combinations of: member counts (1–5), deposit amounts (1–10,000),
  expense amounts (0 to total_deposited)
- [ ] Asserts the invariant for every combination
- [ ] All existing tests still pass

---

## Implementation approach

Since Soroban contracts run in a deterministic environment, generate test
cases using a seeded approach rather than `proptest` (which isn't compatible
with `no_std`). Use a simple loop over generated inputs:

```rust
for members in 1..=5 {
    for deposit_each in [1, 100, 1000, 9999] {
        for spent_pct in [0, 10, 50, 90, 100] {
            // set up env, deposit, approve expense, settle
            // assert invariant
        }
    }
}
```

---

## Files to change

- `contracts/splitstar/tests/test_fuzz.rs` (new file)
- `contracts/splitstar/Cargo.toml` (add `test_fuzz` to test modules if needed)
