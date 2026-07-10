import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import LateralAds from '@/components/LateralAds';
import AdBlockDetector from '@/components/AdBlockDetector';
import Footer from '@/components/Footer';
import GlobalPopunders from '@/components/GlobalPopunders';

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
      <head>
        <meta name="profiton-domain-verification" content="fc1082b69f555d513ea15de2bdef8e83f88a19279fe8bdff6d1676431b3aed7a" />
        {/* Monetag Global Popunder Script (Onclick) */}
        {/* <script dangerouslySetInnerHTML={{
          __html: `(function(s){s.dataset.zone='11184403',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`
        }} /> */}
      </head>
      <body className="min-h-full flex flex-col font-sans transition-colors duration-300 dark:bg-[#0a0a0c] dark:text-white bg-slate-50 text-slate-900 pb-28">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AdBlockDetector />
          {children}
          <Footer />
          <LateralAds />
          <GlobalPopunders />
        </ThemeProvider>
      </body>
    </html>
  );
}
