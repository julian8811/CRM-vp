import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../ui/CommandPalette';

function Layout({ children, currentPage, onNavigate, user, onLogout, title, subtitle }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user} 
          title={title} 
          subtitle={subtitle} 
          onNavigate={onNavigate}
          onCommandPalette={() => setCommandPaletteOpen(true)}
        />
        <main className="flex-1 overflow-auto p-6">
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
