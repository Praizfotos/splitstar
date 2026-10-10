// ============================================================================
// types/index.ts — Shared TypeScript types for SplitStar
// ============================================================================

export type PoolStatus = "Open" | "Locked" | "Settled" | "Cancelled";

export interface Member {
  address:    string;
  deposited:  bigint;
  refundDue:  bigint;
}

export interface Expense {
  description: string;
  amount:      bigint;
  payee:       string;
  submittedBy: string;
  approved:    boolean;
}

export interface Pool {
  id:             bigint;
  name:           string;
  owner:          string;
  token:          string;
  goal:           bigint;
  totalDeposited: bigint;
  totalSpent:     bigint;
  members:        Member[];
  expenses:       Expense[];
  status:         PoolStatus;
  createdAt:      number;
  maxMembers:     number;
}

export interface KnownToken {
  address: string;
  symbol:  string;
  decimals: number;
  name:    string;
}

export const KNOWN_TOKENS: KnownToken[] = [
  {
    address:  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3",
    symbol:   "XLM",
    decimals: 7,
    name:     "Stellar Lumens",
  },
  {
    address:  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    symbol:   "USDC",
    decimals: 7,
    name:     "USD Coin",
  },
];
