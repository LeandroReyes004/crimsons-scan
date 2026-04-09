import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // En un caso real: buscaríamos datos del manga por ID en la BD
  return {
    title: `Leer Capítulo ${params.id} | Crimson's Scan`,
    description: `Lee el último capítulo del manga con máxima calidad y traducción por nuestro staff.`,
    openGraph: {
      title: `Solo Leveling - Capítulo ${params.id} | Crimson's Scan`,
      description: 'Disfruta de la mejor calidad visual en nuestro lector oficial.',
      images: ['/portada.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
    }
  };
}

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
