import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Emora — AI Mental Health Support',
    template: '%s | Emora',
  },
  description:
    'Emora is an AI-powered mental health support assistant providing empathetic conversations, mood tracking, journaling, and crisis support. Not a substitute for professional care.',
  keywords: ['mental health', 'AI support', 'wellbeing', 'CBT', 'mindfulness'],
  robots: 'noindex, nofollow', // Local app — no public indexing needed
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className="font-sans bg-slate-50 text-slate-900 antialiased">
        {/* Skip to main content for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none"
        >
          Skip to main content
        </a>

        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
