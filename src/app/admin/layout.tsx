
import { Navbar } from '@/components/Navbar';
import type { ReactNode } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <AdminAuthGuard>
          {children}
        </AdminAuthGuard>
      </main>
       <footer className="bg-card border-t border-border py-6 text-center text-muted-foreground">
        <p>TestWave Admin Panel</p>
      </footer>
    </div>
  );
}
