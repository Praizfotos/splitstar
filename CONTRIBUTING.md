# Contributing to SplitStar

Thanks for your interest in improving SplitStar! We welcome contributions of all kinds — contracts, frontend, docs, and tests.

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). In short: be respectful, constructive, and assume good intent. Maintainers may reject contributions or close discussions that violate it.

---

## Development setup

### Prerequisites

```bash
# Rust + WASM target
rustup target add wasm32-unknown-unknown

# Stellar CLI (>= 25.x)
cargo install --locked stellar-cli

# Node.js 20+ and npm
node -v
```

### Contract

```bash
git clone https://github.com/YOUR_ORG/splitstar
cd splitstar

# Run the full test suite
cargo test -p splitstar-contract --features testutils

# Build optimised WASM
stellar contract build --manifest-path contracts/splitstar/Cargo.toml
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # add your deployed contract ID
npm install
npm run dev                  # http://localhost:3000
```

---

## Branch naming

| Prefix | Use for | Example |
|---|---|---|
| `feat/` | New features | `feat/goal-progress-widget` |
| `fix/` | Bug fixes | `fix/settle-rounding-dust` |
| `docs/` | Documentation only | `docs/api-table` |
| `test/` | Adding or improving tests | `test/cancel-after-lock` |
| `refactor/` | No-behaviour-change rewrites | `refactor/storage-helpers` |
| `chore/` | Tooling, CI, dependencies | `chore/bump-sdk-22` |

---

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

- **Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`, `ci`
- **Scopes**: `contract`, `frontend`, `ci`, `docs`
- Description is imperative mood, lowercase, no trailing period

Examples:

```
feat(contract): add goal_progress_pct view
fix(contract): reject deposit after pool cancel
docs: expand security model section
test(expenses): cover double-approve rejection
```

---

## Pull request process

1. Fork and branch from `main` using the naming convention above.
2. Make your change with tests where applicable.
3. Run the full check list (below) and make sure everything is green.
4. Open a PR against `main` with a clear title and description.
5. Explain the **why** behind the change, not just the what.
6. Link any related issues (`Closes #12`).
7. Request review. At least one maintainer approval is required to merge.
8. Keep PRs focused — one logical change per PR. Large PRs will be split or asked to be split.

### PR checklist

- [ ] `cargo test -p splitstar-contract --features testutils` passes
- [ ] `cargo fmt --check -p splitstar-contract` is clean
- [ ] `cargo clippy -p splitstar-contract` — zero warnings
- [ ] `npm run lint` passes (frontend changes)
- [ ] `npm run type-check` passes (frontend changes)
- [ ] New contract behaviour has at least one test
- [ ] PR description explains the *why* and any trade-offs

---

## Running tests

```bash
# Contract: unit + integration tests
cargo test -p splitstar-contract --features testutils

# Contract: style and lints
cargo fmt --check -p splitstar-contract
cargo clippy -p splitstar-contract

# Frontend
cd frontend
npm run lint
npm run type-check
npm run build
```

The contract tests live in three files:

| File | Covers |
|---|---|
| `tests/test_pools.rs` | Pool creation, join, deposit, goals, views |
| `tests/test_expenses.rs` | Submit, approve, sequential expenses, payments |
| `tests/test_edge_cases.rs` | Guards, double-calls, refunds, auth violations |

---

## Code style

### Rust (contract)

- All public functions must have a doc comment
- All errors must be typed `Error` variants — **no panics** in production paths
- Token math in `i128`; prefer checked/saturating ops
- Update state before any token transfer (see existing deposit/approve paths)
- Run `cargo fmt` and `cargo clippy` before submitting
- Keep the `#![no_std]` build working — no `std` dependencies

### TypeScript / React (frontend)

- Strict TypeScript — no `any` except in Soroban SDK interop shims
- Use React Query for all async state — no `useEffect` + `useState` fetch patterns
- Component files: PascalCase. Hooks: `use` prefix, camelCase
- Run ESLint and Prettier (`npm run lint`); formats via Prettier defaults
- Tailwind for styling; reuse `clsx` / `tailwind-merge` helpers in `src/lib`

---

## Areas for contribution

Watch for these labels on GitHub issues:

- 🟩 **good first issue** — small, well-scoped, ideal for first-time contributors
- 🟨 **help wanted** — larger tasks where maintainer bandwidth is limited

Ideas to get started:

- Frontend: pool dashboard, expense timeline, goal progress bar, Freighter connect flow
- Contract: additional views for the UI, event-indexing helpers, fuzz/property tests
- Docs: tutorials (create a pool, settle a trip), translated docs
- Tooling: deploy scripts, CI coverage reports, local network test harness
- Future work (discuss first): multi-sig expense approval, NFT/SBT membership badges, streaming deposits

---

## Reporting bugs

Open a GitHub issue with:

1. Contract/frontend version (or commit SHA)
2. Network (Testnet / local)
3. Steps to reproduce
4. Expected vs actual behaviour
5. Relevant transaction hashes, if on-chain

---

## Security vulnerabilities

Please **do not** open a public issue for security bugs.
Email `security@splitstar.io` instead. See [SECURITY.md](SECURITY.md) for our disclosure policy.
