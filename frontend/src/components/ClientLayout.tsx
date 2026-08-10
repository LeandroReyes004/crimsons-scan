'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Recuperar la preferencia guardada
  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // Si estamos en el panel de administrador, devolvemos el contenido sin el layout
  const isNoLayoutRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/uploader');
  if (isNoLayoutRoute) {
    return <>{children}</>;
  }

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop collapsible, Mobile oculto temporalmente (hasta que haya botón en mobile) */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden opacity-0'}`}>
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </div>
      
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <TopNav toggleSidebar={toggleSidebar} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
