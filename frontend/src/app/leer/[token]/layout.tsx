import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import AntiDevTools from '@/components/AntiDevTools';

export default function LeerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AntiDevTools />
      {children}
    </>
  );
}
