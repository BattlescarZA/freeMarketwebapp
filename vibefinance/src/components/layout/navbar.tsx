import { User, Bell, Menu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Navbar({ onMenuClick, className }: NavbarProps) {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      "border-b border-border",
      className
    )}>
      <div className="container flex h-16 items-center">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="mr-4 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-lg shadow-primary/25">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent hidden sm:block">
              {APP_NAME}
            </span>
          </Link>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-1 flex-1 ml-8">
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Portfolio', href: '/portfolio' },
            { label: 'Watchlist', href: '/watchlist' },
            { label: 'Insights', href: '/insights' },
          ].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                location.pathname === item.href && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center justify-end space-x-2 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link to="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          
          <ThemeToggle />
          
          <Button
            variant="outline"
            size="sm"
            asChild
            className="ml-2"
          >
            <Link to="/login">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
