"use client";
import { useCallback } from "react";
import { createAccount, createClient, chains } from "genlayer-js";
import { getCachedWalletKey } from "@/lib/auth";

export function useGenLayerTx() {
  const sendTx = useCallback(async (
    contractAddress: string,
    functionName: string,
    args: unknown[],
  ): Promise<string> => {
    const pk = getCachedWalletKey();
    if (!pk) throw new Error("Wallet key not available — please log in again");

    const account = createAccount(pk as `0x${string}`);
    const client = createClient({ chain: chains.studionet, account });

    const txHash = await client.writeContract({
      address: contractAddress as `0x${string}`,
      functionName,
      args: args as any,
      value: BigInt(0),
    });

    if (!txHash) throw new Error("No transaction hash returned from GenLayer");
    return txHash as string;
  }, []);

  return { sendTx };
}
