
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
import { LayoutDashboard, PlusCircle, ClipboardList, UsersIcon, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, disabled: false },
    { href: '/admin/create', label: 'Create Test', icon: PlusCircle, disabled: false },
    { href: '/admin/submissions', label: 'Submissions', icon: ClipboardList, disabled: false },
    { href: '#', label: 'Users', icon: UsersIcon, disabled: true },
    { href: '#', label: 'Settings', icon: Settings, disabled: true },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 h-[calc(100vh-var(--navbar-height,4rem))]"> {/* Adjust height considering navbar */}
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
                      <Link href={item.href} asChild>
                        <SidebarMenuButton
                          isActive={pathname === item.href}
                          tooltip={item.label}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            {/* Optional: <SidebarFooter>...</SidebarFooter> */}
          </Sidebar>
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

// Define navbar height as CSS variable if not already globally available
// For example, in globals.css or a style tag here:
// <style jsx global>{`
//   :root {
//     --navbar-height: 4rem; /* Or actual height of Navbar */
//   }
// `}</style>
