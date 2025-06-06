
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

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/create', label: 'Create Test', icon: PlusCircle },
    // Placeholder items
    { href: '#', label: 'Submissions', icon: ClipboardList, disabled: true },
    { href: '#', label: 'Users', icon: UsersIcon, disabled: true },
    { href: '#', label: 'Settings', icon: Settings, disabled: true },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 h-[calc(100vh-var(--navbar-height,4rem))]"> {/* Adjust height considering navbar */}
          <Sidebar side="left" collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
            <SidebarHeader className="p-3 flex items-center justify-between h-14 border-b border-sidebar-border">
              <Link href="/admin" className="flex items-center gap-2 text-sidebar-primary hover:text-sidebar-primary/80 transition-colors">
                <LayoutDashboard className="h-6 w-6" />
                <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">Admin Panel</span>
              </Link>
              <SidebarTrigger />
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      href={item.href}
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      disabled={item.disabled}
                      className={item.disabled ? "cursor-not-allowed opacity-50" : ""}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
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

