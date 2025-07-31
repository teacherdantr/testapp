
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Key,
  User,
  HelpCircle,
  LogOut,
  Languages,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';

const sidebarNavItems = [
  { href: '/gmtx', label: 'Home', icon: Home },
  { href: '#', label: 'Transcript', icon: FileText },
  { href: '#', label: 'Đổi mã', icon: Key },
  { href: '#', label: 'Tài khoản', icon: User },
  { href: '#', label: 'Trợ giúp', icon: HelpCircle },
  { href: '#', label: 'đăng xuất', icon: LogOut, isBottom: true },
  { href: '#', label: 'Ngôn ngữ', icon: Languages, isBottom: true },
  { href: '#', label: 'Download SMS', icon: Download, isBottom: true },
];

function GmtxSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-blue-800 text-white flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-blue-700">
        <h1 className="text-xl font-bold">PHUOC BINH</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {sidebarNavItems.filter(item => !item.isBottom).map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-blue-700 transition-colors relative',
              pathname === item.href ? 'bg-blue-900' : 'text-blue-200'
            )}
          >
            {pathname === item.href && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-yellow-400 rounded-r-full"></span>}
            <item.icon className="h-5 w-5 mr-3" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 space-y-1 border-t border-blue-700">
         {sidebarNavItems.filter(item => item.isBottom).map(item => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-blue-200 hover:bg-blue-700 transition-colors"
          >
            <item.icon className="h-5 w-5 mr-3" />
            <span>{item.label}</span>
            {item.label === 'Ngôn ngữ' && <span className="ml-auto text-xs">&gt;</span>}
          </Link>
        ))}
      </div>
    </aside>
  );
}


export default function GmtxLayout({ children }: { children: ReactNode }) {
  // Hide default navbar for this specific layout
  return (
    <div className="min-h-screen flex flex-col">
       {/* The default Navbar can be hidden if this layout is meant to be completely standalone */}
       {/* <Navbar /> */}
      <div className="flex flex-1">
        <GmtxSidebar />
        {children}
      </div>
    </div>
  );
}
