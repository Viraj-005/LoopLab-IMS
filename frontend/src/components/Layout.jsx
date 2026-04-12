import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, user, onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-surface flex transition-all duration-200 font-body antialiased">
      <Sidebar 
        user={user} 
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />
      <main className={`flex-1 min-h-screen p-8 lg:p-12 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="max-w-[1700px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
