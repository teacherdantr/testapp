
'use client'; 

import { Navbar } from '@/components/Navbar';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // Import usePathname
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname(); // Get the current path

  // Determine if the current route is the special GMTX layout
  const isGmtxLayout = pathname.startsWith('/gmtx');

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
    });
    setIsMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  // If it's the GMTX layout, we render the children directly,
  // as the gmtx/layout.tsx will provide the full page structure.
  if (isGmtxLayout) {
    return <>{children}</>;
  }

  // Otherwise, render the default app layout with Navbar and Footer
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-card border-t border-border py-6 text-center text-muted-foreground">
        {isMounted && currentYear !== null ? (
          <p>&copy; {currentYear} TestWave. All rights reserved.</p>
        ) : (
          <p>&copy; TestWave. All rights reserved.</p>
        )}
      </footer>
    </div>
  );
}
