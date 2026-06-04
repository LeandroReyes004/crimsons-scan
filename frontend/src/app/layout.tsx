import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import LateralAds from '@/components/LateralAds';

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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2103619293746404"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans transition-colors duration-300 dark:bg-[#0a0a0c] dark:text-white bg-slate-50 text-slate-900">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <LateralAds />
        </ThemeProvider>
      </body>
    </html>
  );
}
