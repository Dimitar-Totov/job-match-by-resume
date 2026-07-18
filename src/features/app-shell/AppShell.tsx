import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useNav } from '../../hooks/useNav';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import './AppShell.css';

export function AppShell() {
  const { screen } = useNav();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <div className="shell">
      <Sidebar />
      <div className="shell__main">
        <AppHeader />
        <main className="shell__content" ref={mainRef} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
