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
  const [contentType, setContentType] = useState<'thread' | 'tweet'>('thread');

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

  const isLoading = status === 'sending' || status === 'confirming';

  return (
    <main className="min-h-screen bg-white text-black p-6 md:p-12 font-sans selection:bg-black selection:text-white">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-black pb-8">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">
              Solana <br /> Content Gen
            </h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-widest text-gray-500">
              Transform Links into High-Quality Content
            </p>
          </div>
          <div className="flex items-center">
            <WalletMultiButton />
          </div>
        </header>

        {!connected ? (
          <section className="flex flex-col items-center justify-center py-20 border-2 border-black border-dashed">
            <p className="text-xl font-bold uppercase mb-4">Awaiting Connection</p>
            <p className="text-sm text-gray-500 mb-8 max-w-xs text-center font-medium">
              Connect your Phantom wallet to access the decentralized content engine.
            </p>
            <div className="animate-bounce">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="black" strokeWidth="3" strokeLinecap="square" />
              </svg>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Input Side */}
            <div className="lg:col-span-12 space-y-8">
              <div className="bg-white border-4 border-black p-6 shadow-hard transition-transform hover:-translate-x-1 hover:-translate-y-1">
                <label className="block text-xs font-black uppercase mb-2 tracking-widest">Target URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="github.com/example/repo"
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-black text-lg font-mono focus:outline-none focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex bg-black p-1 border-2 border-black">
                  {(['thread', 'tweet'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setContentType(type)}
                      className={`px-6 py-2 text-sm font-black uppercase tracking-widest cursor-pointer transition-all ${
                        contentType === type
                          ? 'bg-white text-black'
                          : 'bg-black text-white hover:text-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className={`flex-1 min-w-[200px] px-8 py-4 bg-black text-white text-lg font-black uppercase tracking-widest 
                             border-2 border-black shadow-hard active:translate-x-1 active:translate-y-1 active:shadow-none
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all
                             hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]`}
                >
                  {status === 'sending' && 'Approving...'}
                  {status === 'confirming' && (
                    <span className="flex items-center justify-center gap-2">
                       Confirming...
                    </span>
                  )}
                  {status === 'success' && 'Processing...'}
                  {status === 'error' && 'Retry Transaction'}
                  {status === 'idle' && 'Generate (0.001 SOL)'}
                </button>
              </div>
            </div>

            {/* Status & Output */}
            <div className="lg:col-span-12 space-y-8">
              {isLoading && (
                <div className="border-4 border-black p-8 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-black border-t-transparent animate-spin"></div>
                  <p className="font-black uppercase tracking-widest italic animate-pulse">Syncing with Solana</p>
                </div>
              )}

              {content && (
                <div className="border-4 border-black bg-white shadow-hard relative group">
                  <div className="absolute -top-4 left-6 bg-black text-white px-4 py-1 text-xs font-black uppercase tracking-widest">
                    Generated {contentType}
                  </div>
                  <div className="p-8 pt-10">
                    <pre className="text-sm font-medium leading-relaxed whitespace-pre-wrap font-mono break-all max-h-[500px] overflow-y-auto custom-scrollbar">
                      {content}
                    </pre>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(content)}
                    className="absolute top-4 right-4 bg-white border-2 border-black px-4 py-1 text-xs font-black uppercase hover:bg-black hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                </div>
              )}

              {status === 'success' && txSignature && (
                <div className="border-2 border-black p-6 bg-black text-white space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest opacity-70">Transaction Hash</p>
                  <p className="font-mono text-xs break-all border-b border-white/20 pb-4">{txSignature}</p>
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black uppercase underline hover:no-underline underline-offset-4"
                  >
                    View Explorer 
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              )}

              {status === 'error' && error && (
                <div className="border-4 border-red-600 bg-red-50 p-6">
                  <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">Execution Error</p>
                  <p className="font-bold text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="pt-12 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex justify-between items-center">
          <span>&copy; 2026 Solana Content Engine</span>
          <span className="italic underline underline-offset-4 cursor-pointer hover:text-black transition-colors">Documentation</span>
        </footer>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}</style>
    </main>
  );
}