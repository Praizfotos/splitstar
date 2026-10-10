# fix: mobile responsive polish — audit and fix 375px viewport issues

**Labels:** `bug`, `frontend`, `good first issue`
**Estimated effort:** Small (2–3 hours)

---

## Problem

The pool detail page (`/pool/[id]`) has several layout issues on small screens
(iPhone SE width = 375px, which is still a common device):

1. The available-balance figure overflows its container on small screens
2. The expense approval button and amount text overlap on narrow viewports
3. The member address truncation breaks the grid layout
4. The deposit form and expense form stack awkwardly below 400px
5. The navigation bar wraps onto two lines on 375px

---

## Acceptance criteria

- [ ] All pages render without horizontal scroll on 375px width
- [ ] No text overflow or layout break on any page at 375px, 390px, 414px
- [ ] Test in Chrome DevTools mobile emulation for: iPhone SE, iPhone 14, Galaxy S21
- [ ] The navbar stays on one line at all tested widths
- [ ] Expense list rows don't break at narrow widths
- [ ] All buttons remain tappable (min 44×44px touch target per WCAG 2.5.5)

---

## Files to change

- `frontend/src/app/pool/[id]/page.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/components/PoolCard.tsx`
- `frontend/src/app/dashboard/page.tsx`

---

## Notes

Use Tailwind responsive prefixes (`sm:`, `md:`) rather than custom CSS.
Do not change any contract-facing logic — this is purely visual.
