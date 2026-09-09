import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-main">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="app-content">
          {children}
        </div>
      </main>
    </div>
  );
}
