import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Crimson's Scan",
  description: "Traducción y edición de manga de alta calidad.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Crimson's Scan",
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#e11d48',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full flex flex-col font-sans transition-colors duration-300 dark:bg-[#0a0a0c] dark:text-white bg-slate-50 text-slate-900">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Script
          src="https://pl29641064.effectivecpmnetwork.com/22/96/aa/2296aae2f6e7d670692ad60295e285d2.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
