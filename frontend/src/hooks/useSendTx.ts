'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { useState } from 'react';

// The devnet wallet address — this is who receives the payment
const RECEIVER = new PublicKey('6BTbsEUBZsR8jhwHg73A8Bsj8MeXD39M8J7YTF8WVkpb');

// 0.001 SOL — 1 SOL = 1,000,000,000 lamports (lamports are the smallest unit)
const AMOUNT = 0.001 * LAMPORTS_PER_SOL;

export type TxStatus = 'idle' | 'sending' | 'confirming' | 'success' | 'error';

export function useSendTx() {
  const { connection } = useConnection();       // RPC connection to Devnet
  const { publicKey, sendTransaction } = useWallet(); // user's wallet

  const [status, setStatus] = useState<TxStatus>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (): Promise<string | null> => {
    if (!publicKey) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setStatus('sending');
      setError(null);

      // 1. Build the transaction
      //    SystemProgram.transfer is a built-in Solana instruction
      //    that moves SOL from one account to another
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: RECEIVER,
          lamports: AMOUNT,
        })
      );

      // 2. Get the latest blockhash
      //    Every Solana tx needs a recent blockhash — it's like a timestamp
      //    that prevents replay attacks and expires after ~90 seconds
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // 3. Send — this opens Phantom for the user to approve
      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);
      setStatus('confirming');

      // 4. Confirm — wait until the network has processed the tx
      //    'confirmed' means 2/3 of validators have seen it
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus('success');
      return signature; // we'll pass this to the backend in Stage 3

    } catch (err: any) {
      setStatus('error');
      setError(err?.message ?? 'Transaction failed');
      return null;
    }
  };

  const reset = () => {
    setStatus('idle');
    setTxSignature(null);
    setError(null);
  };

  return { send, status, txSignature, error, reset };
}