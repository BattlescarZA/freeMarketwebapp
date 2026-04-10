import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      
      {/* Navbar */}
      <Navbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
      
      <div className="flex relative">
        {/* Sidebar - Desktop */}
        <Sidebar />
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out md:hidden pt-16",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="container py-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
