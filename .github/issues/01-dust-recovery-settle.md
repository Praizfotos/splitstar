# fix: settle_pool dust accumulation — add dust-recovery path

**Labels:** `bug`, `contract`, `good first issue`
**Estimated effort:** Small (1–3 hours)

---

## Problem

`settle_pool` uses integer floor division to compute each member's refund:

```rust
refund = floor( deposited_i × remaining / total_deposited )
```

When `total_deposited` doesn't divide evenly, the leftover sub-stroop dust stays
locked in the contract forever with no way to recover it.

Example: 3 members each deposited 1,000 stroops, remaining = 1,001 stroops.
Each refund = floor(1001/3) = 333. Total refunded = 999. 2 stroops stuck.

While the amount is tiny per transaction, it accumulates across many pools and
is permanently unrecoverable under the current design.

---

## Acceptance criteria

- [ ] After all member refunds are sent, compute `dust = remaining - sum(refunds)`
- [ ] If `dust > 0`, transfer it to `pool.owner` (the pool creator)
- [ ] Add a test: 3 members with uneven deposit amounts; verify `dust` goes to owner
- [ ] Verify the existing `test_settle_pro_rata_refund` still passes

---

## Files to change

- `contracts/splitstar/src/lib.rs` — `settle_pool` function (~line 180)
- `contracts/splitstar/tests/test_expenses.rs` — add new test

---

## Notes

The dust transfer must happen **after** the member refund loop, and the state
must remain `Settled` (do not reset status). The dust amount will be at most
`member_count - 1` stroops — negligible, but correctness matters.
