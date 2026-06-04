import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return {
    title: `Crimson's Scan — Lector`,
    description: `Lee manga con la mejor calidad y traducción por nuestro staff.`,
    openGraph: {
      title: `Crimson's Scan — Lector`,
      description: 'Disfruta de la mejor calidad visual en nuestro lector oficial.',
      images: ['/portada.jpg'],
    },
  };
}

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
