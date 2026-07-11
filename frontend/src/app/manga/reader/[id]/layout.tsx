import { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/api/mangas/${id}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const manga = data.manga;
    if (!manga) throw new Error('not found');

    const title = `${manga.titulo} — Crimson's Scan`;
    const description = manga.descripcion
      ? manga.descripcion.slice(0, 160)
      : `Lee ${manga.titulo} en Crimson's Scan con la mejor calidad y traducción.`;
    const coverUrl = manga.cover_r2_key ? `${API}/api/cover/${manga.id}` : null;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: coverUrl ? [{ url: coverUrl, width: 400, height: 600 }] : ['/portada.jpg'],
        type: 'website',
        siteName: "Crimson's Scan",
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: coverUrl ? [coverUrl] : ['/portada.jpg'],
      },
    };
  } catch {
    return {
      title: "Crimson's Scan",
      description: 'Lee manga con la mejor calidad.',
    };
  }
}

import AntiDevTools from '@/components/AntiDevTools';

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AntiDevTools />
      {children}
    </>
  );
}
