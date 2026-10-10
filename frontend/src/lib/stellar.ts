// ============================================================================
// lib/stellar.ts — Stellar / Soroban SDK helpers for SplitStar
// ============================================================================

import {
  Contract,
  Networks,
  SorobanRpc,
  Transaction,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  scValToNative,
  nativeToScVal,
} from "@stellar/stellar-sdk";

export const NETWORK             = (process.env.NEXT_PUBLIC_NETWORK ?? "testnet") as "testnet" | "mainnet";
export const RPC_URL             = process.env.NEXT_PUBLIC_RPC_URL             ?? "https://soroban-testnet.stellar.org";
export const HORIZON_URL         = process.env.NEXT_PUBLIC_HORIZON_URL         ?? "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE  = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE  ?? Networks.TESTNET;
export const CONTRACT_ID         = process.env.NEXT_PUBLIC_CONTRACT_ID         ?? "";

export const SECONDS_PER_LEDGER  = 5;

// ── RPC ───────────────────────────────────────────────────────────────────────

export function getRpc(): SorobanRpc.Server {
  return new SorobanRpc.Server(RPC_URL, { allowHttp: false });
}

// ── Transaction helpers ───────────────────────────────────────────────────────

export async function buildTx(
  caller: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  const server  = getRpc();
  const account = await server.getAccount(caller);
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }
  return SorobanRpc.assembleTransaction(tx, sim).build().toXDR();
}

export async function submitTx(
  signedXdr: string
): Promise<SorobanRpc.Api.GetSuccessfulTransactionResponse> {
  const server = getRpc();
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;

  const sendResult = await server.sendTransaction(tx);
  if (sendResult.status === "ERROR") {
    throw new Error(`Submit error: ${sendResult.errorResult?.toXDR("base64")}`);
  }

  let response = await server.getTransaction(sendResult.hash);
  while (response.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 2000));
    response = await server.getTransaction(sendResult.hash);
  }
  if (response.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed: ${response.status}`);
  }
  return response as SorobanRpc.Api.GetSuccessfulTransactionResponse;
}

// ── Read-only simulation ──────────────────────────────────────────────────────

const FAKE_ACCOUNT = {
  accountId:               () => "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
  sequenceNumber:          () => "0",
  incrementSequenceNumber: () => {},
} as any;

export async function readContract(method: string, args: xdr.ScVal[]) {
  const server   = getRpc();
  const contract = new Contract(CONTRACT_ID);
  const tx = new TransactionBuilder(FAKE_ACCOUNT, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) return null;
  const val = (sim as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  return val ? scValToNative(val) : null;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatAmount(raw: bigint, decimals = 7): string {
  if (raw === 0n) return "0";
  const divisor = BigInt(10 ** decimals);
  const whole   = raw / divisor;
  const frac    = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

export function parseAmount(human: string, decimals = 7): bigint {
  const [whole, frac = ""] = human.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole || "0") * BigInt(10 ** decimals) + BigInt(fracPadded || "0");
}
