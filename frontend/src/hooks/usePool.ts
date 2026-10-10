"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { buildTx, submitTx, readContract, parseAmount, NETWORK_PASSPHRASE } from "@/lib/stellar";
import { signTx } from "@/lib/wallet";
import { useWallet } from "./useWallet";
import { nativeToScVal, xdr } from "@stellar/stellar-sdk";
import type { Pool } from "@/types";

// ── Helpers to map raw contract data ─────────────────────────────────────────

function mapPool(raw: any, id: bigint): Pool {
  return {
    id,
    name:           Buffer.from(raw.name).toString("utf8").replace(/\0/g, ""),
    owner:          raw.owner,
    token:          raw.token,
    goal:           BigInt(raw.goal),
    totalDeposited: BigInt(raw.total_deposited),
    totalSpent:     BigInt(raw.total_spent),
    members: (raw.members ?? []).map((m: any) => ({
      address:   m.address,
      deposited: BigInt(m.deposited),
      refundDue: BigInt(m.refund_due),
    })),
    expenses: (raw.expenses ?? []).map((e: any) => ({
      description: Buffer.from(e.description).toString("utf8").replace(/\0/g, ""),
      amount:      BigInt(e.amount),
      payee:       e.payee,
      submittedBy: e.submitted_by,
      approved:    e.approved,
    })),
    status:    raw.status as Pool["status"],
    createdAt: raw.created_at,
    maxMembers: raw.max_members,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function usePool(poolId: bigint | null) {
  return useQuery({
    queryKey: ["pool", poolId?.toString()],
    queryFn: async () => {
      const raw = await readContract("get_pool", [nativeToScVal(poolId!, { type: "u64" })]);
      return raw ? mapPool(raw, poolId!) : null;
    },
    enabled: poolId !== null,
    refetchInterval: 8_000,
  });
}

export function usePoolCount() {
  return useQuery({
    queryKey: ["pool-count"],
    queryFn: async () => {
      const raw = await readContract("next_pool_id", []);
      return raw !== null ? Number(raw) : 0;
    },
    refetchInterval: 15_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreatePool() {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      token: string;
      name: string;
      goal: string;
      maxMembers: number;
    }) => {
      if (!address) throw new Error("Connect wallet first");
      const nameBytes = xdr.ScVal.scvBytes(Buffer.from(params.name.slice(0, 64)));
      const args = [
        nativeToScVal(address,         { type: "address" }),
        nativeToScVal(params.token,    { type: "address" }),
        nameBytes,
        nativeToScVal(parseAmount(params.goal || "0"), { type: "i128" }),
        nativeToScVal(params.maxMembers, { type: "u32" }),
      ];
      const tx = await buildTx(address, "create_pool", args);
      const signed = await signTx(tx, NETWORK_PASSPHRASE, address);
      return submitTx(signed);
    },
    onSuccess: () => { toast.success("Pool created! 🌟"); qc.invalidateQueries({ queryKey: ["pool-count"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useJoinPool(poolId: bigint) {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect wallet first");
      const args = [
        nativeToScVal(poolId,  { type: "u64" }),
        nativeToScVal(address, { type: "address" }),
      ];
      const tx = await buildTx(address, "join_pool", args);
      const signed = await signTx(tx, NETWORK_PASSPHRASE, address);
      return submitTx(signed);
    },
    onSuccess: () => { toast.success("Joined pool!"); qc.invalidateQueries({ queryKey: ["pool", poolId.toString()] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeposit(poolId: bigint) {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: string) => {
      if (!address) throw new Error("Connect wallet first");
      const raw = parseAmount(amount);
      const args = [
        nativeToScVal(poolId,  { type: "u64" }),
        nativeToScVal(address, { type: "address" }),
        nativeToScVal(raw,     { type: "i128" }),
      ];
      const tx = await buildTx(address, "deposit", args);
      const signed = await signTx(tx, NETWORK_PASSPHRASE, address);
      return submitTx(signed);
    },
    onSuccess: () => { toast.success("Deposited! 💰"); qc.invalidateQueries({ queryKey: ["pool", poolId.toString()] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitExpense(poolId: bigint) {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { payee: string; amount: string; description: string }) => {
      if (!address) throw new Error("Connect wallet first");
      const descBytes = xdr.ScVal.scvBytes(Buffer.from(params.description.slice(0, 64)));
      const args = [
        nativeToScVal(poolId,       { type: "u64" }),
        nativeToScVal(address,      { type: "address" }),
        nativeToScVal(params.payee, { type: "address" }),
        nativeToScVal(parseAmount(params.amount), { type: "i128" }),
        descBytes,
      ];
      const tx = await buildTx(address, "submit_expense", args);
      const signed = await signTx(tx, NETWORK_PASSPHRASE, address);
      return submitTx(signed);
    },
    onSuccess: () => { toast.success("Expense submitted!"); qc.invalidateQueries({ queryKey: ["pool", poolId.toString()] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApproveExpense(poolId: bigint) {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expenseIdx: number) => {
      if (!address) throw new Error("Connect wallet first");
      const args = [
        nativeToScVal(poolId,      { type: "u64" }),
        nativeToScVal(expenseIdx,  { type: "u32" }),
      ];
      const tx = await buildTx(address, "approve_expense", args);
      const signed = await signTx(tx, NETWORK_PASSPHRASE, address);
      return submitTx(signed);
    },
    onSuccess: () => { toast.success("Expense approved & paid! ✅"); qc.invalidateQueries({ queryKey: ["pool", poolId.toString()] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSettlePool(poolId: bigint) {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect wallet first");
      const args = [nativeToScVal(poolId, { type: "u64" })];
      const tx = await buildTx(address, "settle_pool", args);
      const signed = await signTx(tx, NETWORK_PASSPHRASE, address);
      return submitTx(signed);
    },
    onSuccess: () => { toast.success("Pool settled! Refunds sent."); qc.invalidateQueries({ queryKey: ["pool", poolId.toString()] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
