# feat: CSV export of pool expenses in the frontend

**Labels:** `enhancement`, `frontend`, `good first issue`
**Estimated effort:** Small (2–3 hours)

---

## Problem

Users have no way to export pool activity for accounting, receipts, or
personal records. A CSV with all expenses is the simplest useful format —
it opens in Excel, Google Sheets, and every accounting tool.

---

## Proposed solution

Add an "Export CSV" button to the pool detail page (`/pool/[id]`).
Clicking it generates and immediately downloads a `.csv` file — no server,
no API, pure client-side using the `Blob` API.

**CSV columns:**
```
#, Description, Amount (USDC), Payee, Submitted By, Status, Ledger
```

**Example row:**
```
1, Hotel Shinjuku, 1200.00, GXXXX...YYYY, GAAA...BBBB, Approved, 54321098
```

---

## Acceptance criteria

- [ ] "Export CSV" button visible on `/pool/[id]` when pool has at least 1 expense
- [ ] Clicking downloads `splitstar-pool-{id}-expenses.csv`
- [ ] CSV includes a header row
- [ ] Amounts formatted as human-readable decimals (not raw stroops)
- [ ] Addresses are full Stellar public keys (not truncated)
- [ ] Works in Chrome, Firefox, and Safari without any backend call
- [ ] Button is disabled / hidden when `pool.expenses.length === 0`

---

## Files to change

- `frontend/src/app/pool/[id]/page.tsx` — add button and `exportCSV` function
- No contract changes needed

---

## Implementation hint

```typescript
function exportCSV(pool: Pool) {
  const rows = [
    ["#", "Description", "Amount", "Payee", "Submitted By", "Status"],
    ...pool.expenses.map((e, i) => [
      i + 1,
      e.description,
      formatAmount(e.amount),
      e.payee,
      e.submittedBy,
      e.approved ? "Approved" : "Pending",
    ]),
  ];
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `splitstar-pool-${pool.id}-expenses.csv`;
  a.click();
}
```
