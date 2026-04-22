import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const InternLayout = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/intern/dashboard' },
    { name: 'Browse Jobs', icon: 'explore', path: '/intern/jobs' },
    { name: 'My Applications', icon: 'description', path: '/intern/applications' },
    { name: 'Profile', icon: 'person', path: '/intern/profile' },
  ];

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-surface flex flex-col font-body antialiased transition-all duration-300">
      {/* ── Top Navigation ── */}
      <nav className="h-16 md:h-20 glass-nav border-b border-slate-200/50 dark:border-dark-border sticky top-0 z-50 px-4 md:px-8 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-10">
            {/* Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/intern/dashboard')}>
                <div className="w-10 h-10 kinetic-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30 flex-shrink-0">
                    <span className="material-symbols-outlined text-xl">all_inclusive</span>
                </div>
                <div className="hidden sm:block">
                    <span className="text-xl font-black text-primary tracking-tighter font-headline text-glow block leading-none">LoopLab</span>
                    <span className="text-[9px] font-black text-on-surface-variant dark:text-dark-muted uppercase tracking-[0.18em] opacity-40">Intern Portal</span>
                </div>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => 
                            `flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                isActive 
                                    ? 'bg-primary/5 text-primary' 
                                    : 'text-on-surface-variant dark:text-dark-muted hover:text-primary hover:bg-white/5'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                        {item.name}
                    </NavLink>
                ))}
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
                <p className="text-xs font-black text-on-surface dark:text-dark-text tracking-tight">{user?.first_name} {user?.last_name}</p>
                <p className="text-[9px] font-black text-on-surface-variant dark:text-dark-muted uppercase tracking-widest opacity-60">Applicant Identity</p>
            </div>
            
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-black uppercase overflow-hidden">
                {user?.profile_picture_url ? (
                    <img 
                        src={user.profile_picture_url} 
                        alt="Profile" 
                        loading="lazy"
                        onLoad={(e) => e.target.style.opacity = 1}
                        className="w-full h-full object-cover opacity-0 transition-opacity duration-500" 
                    />
                ) : (
                    (user?.first_name ? user.first_name[0] : 'U')
                )}
            </div>

            <button 
                onClick={handleLogout}
                className="p-2.5 rounded-xl text-on-surface-variant dark:text-dark-muted hover:text-danger hover:bg-danger/5 transition-all"
                title="Disconnect Session"
            >
                <span className="material-symbols-outlined">logout</span>
            </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

      {/* ── Mobile Nav ── */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 glass-nav border border-slate-200/50 rounded-2xl shadow-2xl z-50 flex items-center justify-around px-4">
          {navItems.map((item) => (
              <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                      `flex flex-col items-center gap-1 transition-all ${
                          isActive ? 'text-primary' : 'text-on-surface-variant opacity-60'
                      }`
                  }
              >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter">{item.name.split(' ')[0]}</span>
              </NavLink>
          ))}
      </div>
    </div>
  );
};

export default InternLayout;
