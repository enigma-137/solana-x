import type { Metadata } from 'next';
import SolanaWalletProvider from '@/providers/WalletProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solana Content Gen',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}