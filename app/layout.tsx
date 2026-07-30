import type { Metadata } from 'next';
import { Inter, Sora, IBM_Plex_Mono } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'NexCart AI — The AI Operating System for Modern Businesses',
  description: 'NexCart AI is the AI operating system for modern businesses — discover, connect, and deploy autonomous AI agents to run support, sales, marketing, and operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased text-zinc-900 bg-[#F4F6FB] dark:text-zinc-100 dark:bg-[#0A0B0F] min-h-screen selection:bg-brass-300/50 dark:selection:bg-brass-500/40"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
