import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="h-screen w-screen flex flex-col bg-gis-navy text-white overflow-hidden">
      {!isHome && <Header />}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
