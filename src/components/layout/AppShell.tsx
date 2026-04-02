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
    <div
      className="w-screen flex flex-col bg-gis-navy text-white overflow-hidden"
      style={{
        height: '100vh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {!isHome && <Header />}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
