import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ user, isCollapsed, setIsCollapsed, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [appsExpanded, setAppsExpanded] = useState(true);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleApps = () => setAppsExpanded(!appsExpanded);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Job Board', icon: 'work', path: '/job-posts' },
    {
      name: 'Applications',
      icon: 'description',
      path: '/applications',
      subItems: [
        { name: 'All Applications', path: '/applications', icon: 'group' },
        { name: 'Duplicates', path: '/applications/duplicates', icon: 'content_copy' },
        { name: 'Spam', path: '/applications/spam', icon: 'report_gmailerrorred' },
      ],
    },
    { name: 'Intern Registry', icon: 'people', path: '/interns' },
    { name: 'Email Templates', icon: 'mail', path: '/templates' },
    // COFOUNDER EXTRA: Staff Management
    ...( ['COFOUNDER', 'ADMIN'].includes(user?.role) ? [
        { name: 'Staff Registry', icon: 'admin_panel_settings', path: '/admin/users' }
    ] : []),
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <aside
      className={`h-screen fixed left-0 top-0 glass-nav dark:border-dark-border border-r border-slate-200/50 flex flex-col z-40 transition-all duration-300 overflow-hidden ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* ── Brand Header ── */}
      <div className="relative flex items-center px-4 pt-5 pb-4">
        <div className="w-10 h-10 kinetic-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30 flex-shrink-0">
          <span className="material-symbols-outlined text-xl">all_inclusive</span>
        </div>

        {!isCollapsed && (
          <div className="ml-3 overflow-hidden">
            <span className="text-xl font-black text-primary tracking-tighter font-headline text-glow block leading-none">
              LoopLab
            </span>
            <span className="text-[9px] font-black text-on-surface-variant dark:text-dark-muted uppercase tracking-[0.18em] opacity-40">
              {user?.role || 'Admin'} Console
            </span>
          </div>
        )}

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            title="Collapse sidebar"
            className="ml-auto flex items-center justify-center w-7 h-7 rounded-lg text-on-surface-variant dark:text-dark-muted hover:bg-primary/10 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              chevron_left
            </span>
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center pb-4">
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant dark:text-dark-muted hover:bg-primary/10 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              chevron_right
            </span>
          </button>
        </div>
      )}

      {/* ── User Quick Profile ── */}
      {!isCollapsed && (
        <div className="px-3 mb-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 dark:bg-dark-surface-3/60 border border-white/20 dark:border-dark-border backdrop-blur-sm">
            <div className="w-9 h-9 rounded-full border-2 border-primary/20 shadow-sm bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-sm flex-shrink-0">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-on-surface dark:text-dark-text truncate">
                {user?.full_name || 'Staff User'}
              </p>
              <p className="text-[9px] text-on-surface-variant dark:text-dark-muted uppercase tracking-widest font-black opacity-60">
                {user?.role} Profile
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar px-2">
        {navItems.map((item) => (
          <div key={item.name}>
            {!item.subItems ? (
              <NavLink
                to={item.path}
                title={isCollapsed ? item.name : ''}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'kinetic-gradient text-white shadow-md shadow-primary/20'
                      : 'text-on-surface-variant dark:text-dark-muted hover:bg-white/70 dark:hover:bg-dark-surface-3 hover:text-primary'
                  }`
                }
              >
                <span className="material-symbols-outlined transition-transform group-hover:scale-110 flex-shrink-0">
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="text-sm font-bold font-headline whitespace-nowrap">{item.name}</span>
                )}
              </NavLink>
            ) : (
              <div>
                <button
                  onClick={isCollapsed ? undefined : toggleApps}
                  title={isCollapsed ? item.name : ''}
                  className={`w-full flex items-center px-3 py-3 rounded-xl transition-all group ${
                    isCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    location.pathname.startsWith(item.path)
                      ? 'text-primary'
                      : 'text-on-surface-variant dark:text-dark-muted hover:bg-white/70 dark:hover:bg-dark-surface-3'
                  }`}
                >
                  <div className={`flex items-center gap-3 ${isCollapsed ? '' : ''}`}>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform flex-shrink-0">
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="text-sm font-bold font-headline whitespace-nowrap">{item.name}</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`material-symbols-outlined text-sm transition-transform duration-300 ${
                        appsExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  )}
                </button>

                {!isCollapsed && appsExpanded && (
                  <div className="mt-0.5 ml-5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {item.subItems.map((sub) => (
                      <NavLink
                        key={sub.name}
                        to={sub.path}
                        end={sub.path === '/applications'}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                            isActive
                              ? 'text-primary bg-primary/5'
                              : 'text-on-surface-variant dark:text-dark-muted hover:text-primary hover:bg-white/60 dark:hover:bg-dark-surface-3'
                          }`
                        }
                      >
                        <span className="material-symbols-outlined text-sm">{sub.icon}</span>
                        {sub.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="px-2 pb-4 pt-3 border-t border-slate-200/50 dark:border-dark-border space-y-1">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Sign Out' : ''}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-on-surface-variant dark:text-dark-muted hover:text-danger hover:bg-danger/5 transition-all ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <span className="material-symbols-outlined flex-shrink-0">logout</span>
          {!isCollapsed && (
            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Terminate Session</span>
          )}
        </button>

        {!isCollapsed && (
          <div className="px-3 pt-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <p className="text-[9px] font-black text-success uppercase tracking-widest leading-none translate-y-[1px]">
                System: Optimal
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
