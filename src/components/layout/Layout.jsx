import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../ui/CommandPalette';

function Layout({ children, currentPage, onNavigate, user, onLogout, title, subtitle }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => {
      if (e.matches) setMobileNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (mobileNavOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileNavOpen]);

  return (
    <div className="flex h-dvh min-h-dvh max-h-dvh bg-slate-50 dark:bg-stitch-bg overflow-hidden">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
          aria-label="Cerrar menú de navegación"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden w-full">
        <Header
          user={user}
          title={title}
          subtitle={subtitle}
          onNavigate={onNavigate}
          onCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 custom-scrollbar dark:bg-stitch-bg safe-bottom">
          {children}
        </main>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export { Layout };
