'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import LateralAds from '@/components/LateralAds';
import GlobalPopunders from '@/components/GlobalPopunders';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      const newState = !sidebarOpen;
      setSidebarOpen(newState);
      localStorage.setItem('sidebarOpen', String(newState));
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop collapsible */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden opacity-0'}`}>
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Usamos un wrapper que escuche los clicks para cerrar el sidebar al navegar */}
        <div className="w-full h-full" onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) setMobileSidebarOpen(false);
        }}>
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
      <LateralAds />
      <GlobalPopunders />
    </div>
  );
}
