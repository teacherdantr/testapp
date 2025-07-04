
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LayoutDashboard, PlusCircle, ClipboardList, UsersIcon, Settings, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, disabled: false },
    { href: '/admin/create', label: 'Create Test', icon: PlusCircle, disabled: false },
    { href: '/admin/submissions', label: 'Submissions', icon: ClipboardList, disabled: false },
    { href: '/admin/redirects', label: 'Redirect Links', icon: LinkIcon, disabled: false },
    { href: '#', label: 'Users', icon: UsersIcon, disabled: true },
    { href: '#', label: 'Settings', icon: Settings, disabled: true },
  ];

  const SidebarSkeleton = () => (
    <div className="hidden md:block border-r bg-sidebar" style={{ width: 'var(--sidebar-width-icon)' }}>
      <div className="p-3 flex items-center justify-end h-14 border-b border-sidebar-border">
          <Skeleton className="h-7 w-7 rounded-md" />
      </div>
      <div className="flex flex-col gap-2 p-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 h-[calc(100vh-var(--navbar-height,4rem))]">
          {isMounted ? (
            <Sidebar side="left" collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
              <SidebarHeader className="p-3 flex items-center justify-end h-14 border-b border-sidebar-border">
                <SidebarTrigger />
              </SidebarHeader>
              <SidebarContent className="p-2">
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      {item.disabled || item.href === '#' ? (
                        <SidebarMenuButton
                          tooltip={item.label}
                          disabled={true}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
          ) : (
            <SidebarSkeleton />
          )}
          <SidebarInset className="flex-1 overflow-y-auto bg-background">
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AdminAuthGuard>
                {children}
              </AdminAuthGuard>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
       <footer className="bg-card border-t border-border py-6 text-center text-muted-foreground">
        <p>TestWave Admin Panel</p>
      </footer>
    </div>
  );
}
