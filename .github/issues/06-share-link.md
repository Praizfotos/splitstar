# feat: shareable pool invite link — read-only view without a wallet

**Labels:** `enhancement`, `frontend`
**Estimated effort:** Small–Medium (2–4 hours)

---

## Problem

The pool owner wants to share the pool with friends who haven't installed
Freighter yet, or who just want to check the status before joining. Right now,
visiting `/pool/42` without a wallet gives an error or broken UI because hooks
assume `address` is set.

---

## Proposed solution

Make `/pool/[id]` fully functional in **read-only mode** with no wallet connected:

1. All data displays (name, members, goal progress, expenses, status)
2. Action buttons (Deposit, Submit Expense, Approve, Settle) are hidden
3. A "Connect wallet to participate" banner appears at the top
4. A "Copy invite link" button copies `https://[domain]/pool/42` to clipboard

Additionally, add a "Share" button visible to the pool owner (when connected)
that copies the link and shows a toast: *"Link copied! Share it with your group."*

---

## Acceptance criteria

- [ ] `/pool/[id]` loads and displays all pool data without a connected wallet
- [ ] No JavaScript errors when `address === null`
- [ ] "Connect wallet to participate" banner shown when not connected
- [ ] "Copy invite link" button present and functional
- [ ] Pool owner sees a "Share" button that copies the URL and shows a toast
- [ ] Mobile-friendly (button fits on 375px width)

---

## Files to change

- `frontend/src/app/pool/[id]/page.tsx`
- `frontend/src/components/WalletButton.tsx` (may need minor update)
