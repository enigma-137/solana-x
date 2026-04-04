'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSendTx } from '@/hooks/useSendTx';
import { useState } from 'react';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { send, status, txSignature, error } = useSendTx();
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'thread' | 'article'>('thread');


  const handleGenerate = async () => {
    const sig = await send();
    if (sig) {
      try {
        const res = await fetch('http://localhost:3001/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tx_signature: sig,
            url,
            content_type: contentType,
          }),
        });
        const data = await res.json();
        if (data.success) setContent(data.content);
      } catch (err) {
        console.error('Backend call failed:', err);
      }
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Solana Content Generator</h1>

      <WalletMultiButton />

      {connected && publicKey && (
        <>
          <div className="p-4 bg-gray-100 rounded-lg text-sm font-mono break-all max-w-md w-full">
            <p className="text-gray-500 mb-1">Connected wallet:</p>
            <p className="text-gray-900">{publicKey.toBase58()}</p>
          </div>

          {/* Paste link input — wired up properly in Stage 4 */}
          <input
            type="text"
            value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a GitHub / article link..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {/* Generate button — triggers the SOL payment */}
          <button
            onClick={handleGenerate}
            disabled={status === 'sending' || status === 'confirming'}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium
                       hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {status === 'sending' && 'Waiting for approval...'}
            {status === 'confirming' && 'Confirming on-chain...'}
            {status === 'success' && 'Done!'}
            {status === 'error' && 'Try again'}
            {status === 'idle' && 'Generate (0.001 SOL)'}
          </button>


          {/* Content type selector */}
          <div className="flex gap-3">
            {(['thread', 'article'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setContentType(type)}
                className={`px-4 py-1.5 rounded-full text-sm capitalize transition
        ${contentType === type
                    ? 'bg-purple-600 text-white'
                    : 'border border-gray-300 text-gray-600 hover:border-purple-400'}`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Generated content output */}
          {content && (
            <div className="w-full max-w-md mt-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Generated {contentType}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(content)}
                  className="text-xs text-purple-600 hover:underline"
                >
                  Copy
                </button>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                {content}
              </div>
            </div>
          )}

          {/* Status messages */}
          {status === 'success' && txSignature && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm max-w-md w-full">
              <p className="text-green-700 font-medium mb-1">Payment confirmed!</p>
              <p className="text-green-600 font-mono break-all text-xs">{txSignature}</p>

              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 text-xs mt-2 inline-block hover:underline"
              >
                View on Solana Explorer →
              </a>
            </div>
          )}

          {status === 'error' && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm max-w-md w-full">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </>
      )}

      {!connected && (
        <p className="text-gray-400 text-sm">Connect your Phantom wallet to continue</p>
      )}
    </main>
  );
}