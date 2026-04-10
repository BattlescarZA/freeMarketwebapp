import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Eye,
  Sparkles,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Wallet, label: 'Portfolio', href: '/portfolio' },
  { icon: Eye, label: 'Watchlist', href: '/watchlist' },
  { icon: Sparkles, label: 'Insights', href: '/insights' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="absolute top-14 left-0 right-0 bg-background border-b shadow-lg">
          <nav className="container py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href || (currentPath === '/' && item.href === '/dashboard');
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
