import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/scout/navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'ScoutAI — Talent Scouting Agent',
  description: 'AI-powered candidate scouting that scores both skill fit and genuine interest.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
