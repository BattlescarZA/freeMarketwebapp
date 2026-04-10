import { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border-y sm:border sm:rounded-md">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveCard({ children, className = '' }: ResponsiveCardProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
