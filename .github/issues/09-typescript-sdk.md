# feat: generate TypeScript bindings from contract ABI and add to Makefile

**Labels:** `enhancement`, `tooling`, `dx`
**Estimated effort:** Small (1–2 hours)

---

## Problem

The TypeScript frontend currently calls contract functions using raw
`nativeToScVal` conversions, which are error-prone and drift out of sync when
the contract interface changes. Soroban SDK ships a `stellar contract bindings typescript`
command that generates a fully-typed TypeScript client from the contract's
embedded XDR spec.

---

## Proposed solution

1. Add a `bindings` Makefile target that:
   - Builds the WASM
   - Runs `stellar contract bindings typescript` to output to `frontend/src/lib/contract.ts`
2. Add `contract.ts` to `.gitignore` (generated file)
3. Update the frontend hooks to import from the generated bindings where possible

---

## Acceptance criteria

- [ ] `make bindings` runs without error when Stellar CLI is installed
- [ ] Generated file appears at `frontend/src/lib/contract.ts`
- [ ] At least one hook in `usePool.ts` uses the typed client instead of raw `nativeToScVal`
- [ ] `contract.ts` added to `.gitignore`
- [ ] README updated with `make bindings` in the quick-start section

---

## Makefile target to add

```makefile
bindings: build
	stellar contract bindings typescript \
	  --wasm target/wasm32-unknown-unknown/release/splitstar_contract.wasm \
	  --output-dir frontend/src/lib/generated \
	  --overwrite
```

---

## Files to change

- `Makefile`
- `.gitignore`
- `frontend/src/lib/` (new generated directory)
- `frontend/src/hooks/usePool.ts` (update one or more calls)
- `README.md`
