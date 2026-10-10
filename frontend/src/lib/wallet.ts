// ============================================================================
// lib/wallet.ts — Freighter wallet integration (v2 API)
// ============================================================================

import {
  getPublicKey,
  getNetworkDetails,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";

export async function checkFreighter(): Promise<boolean> {
  try {
    return await isConnected();
  } catch {
    return false;
  }
}

export async function connectWallet() {
  if (!(await checkFreighter())) {
    throw new Error("Freighter not installed. Visit https://freighter.app");
  }
  const address = await requestAccess();
  if (!address) throw new Error("Access denied — open Freighter and approve the connection.");

  const net = await getNetworkDetails();
  return {
    address,
    network: net.network,
    networkPassphrase: net.networkPassphrase,
  };
}

export async function getWalletAddress(): Promise<string> {
  return getPublicKey();
}

export async function signTx(
  xdr: string,
  networkPassphrase: string,
  address: string
): Promise<string> {
  const signedTxXdr = await signTransaction(xdr, {
    networkPassphrase,
    accountToSign: address,
  });
  if (!signedTxXdr) throw new Error("Transaction was not signed.");
  return signedTxXdr;
}
