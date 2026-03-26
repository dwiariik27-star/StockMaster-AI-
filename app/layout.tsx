import type {Metadata} from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles
import { Toaster } from '@/components/ui/sonner';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'StockMaster AI',
  description: 'Adobe Stock Market Intelligence & Mass Production Platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans bg-[#050505] text-cyan-50 antialiased selection:bg-fuchsia-500/40`} suppressHydrationWarning>
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
