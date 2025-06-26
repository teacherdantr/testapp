
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Waves, ListChecks, ArchiveIcon, UserCog, Sun, Moon, Palette } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { useUIVersion } from '@/components/ui-version-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
 
export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { uiVersion, setUIVersion } = useUIVersion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/select-test', label: 'Take a Test', icon: ListChecks },
    { href: '/public-records', label: 'Test History', icon: ArchiveIcon },
    { href: '/admin', label: 'Admin', icon: UserCog },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-primary hover:text-primary/80 transition-colors">
              <Waves className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">TestWave</span>
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={cn(
                    "font-medium text-sm px-3 py-2",
                    pathname === item.href
                      ? "text-primary bg-primary/10 hover:text-primary/90 hover:bg-primary/15"
                      : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Link href={item.href}>
                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                    {item.label}
                  </Link>
                </Button>
              ))}
            </div>
            
            {isMounted && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Change UI Theme">
                      <Palette className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>UI Version</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={uiVersion} onValueChange={(v) => setUIVersion(v as 'v1' | 'v2')}>
                      <DropdownMenuRadioItem value="v1">Default</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="v2">Modern</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-primary" />
                  )}
                </Button>
              </>
            )}
            {!isMounted && (
                 <Button variant="ghost" size="icon" className="ml-2" disabled>
                    <Moon className="h-5 w-5 text-transparent" /> {/* Placeholder */}
                 </Button>
            )}

            {/* Mobile Menu - Simplified for key actions */}
            <div className="md:hidden flex items-center">
               <Button variant="ghost" size="icon" asChild className="mr-1">
                  <Link href="/select-test" aria-label="Take a Test">
                      <ListChecks className="h-5 w-5 text-primary"/>
                  </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                  <Link href="/public-records" aria-label="Test History">
                      <ArchiveIcon className="h-5 w-5"/>
                  </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
