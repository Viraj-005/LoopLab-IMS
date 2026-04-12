import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';

// Layouts
import Layout from './components/Layout';
import InternLayout from './components/InternLayout';
import { NotificationProvider } from './context/NotificationContext';

// Base Pages
import Login from './pages/Login';

// Staff Pages
import Dashboard from './pages/Dashboard';
import AllApplications from './pages/AllApplications';
import ApplicationDetail from './pages/ApplicationDetail';
import EmailTemplates from './pages/EmailTemplates';
import Settings from './pages/Settings';
import JobPosts from './pages/JobPosts';
import CreateJobPost from './pages/CreateJobPost';
import EditJobPost from './pages/EditJobPost';
import UserManagement from './pages/cofounder/UserManagement';

// Intern Pages
import OAuthCallback from './pages/intern/OAuthCallback';
import InternDashboard from './pages/intern/InternDashboard';
import InternProfile from './pages/intern/InternProfile';
import InternBrowseJobs from './pages/intern/InternBrowseJobs';
import ApplyJob from './pages/intern/ApplyJob';
import MyApplications from './pages/intern/MyApplications';

const App = () => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'staff' or 'intern'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedType = localStorage.getItem('user_type');
    if (savedUser && savedType) {
      setUser(JSON.parse(savedUser));
      setUserType(savedType);
    }
    
    // Apply appearance settings
    const applyAppearance = () => {
      const savedAppearance = localStorage.getItem('ims_appearance');
      const appearance = savedAppearance ? JSON.parse(savedAppearance) : { theme: 'light', density: 'comfortable' };
      const root = window.document.documentElement;
      
      let theme = appearance.theme;
      if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      if (theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      
      if (appearance.density === 'compact') root.classList.add('compact');
      else root.classList.remove('compact');
    };

    applyAppearance();
    setLoading(false);
    
    window.addEventListener('ims_appearance_changed', applyAppearance);
    const systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const savedAppearance = localStorage.getItem('ims_appearance');
      const appearance = savedAppearance ? JSON.parse(savedAppearance) : { theme: 'light' };
      if (appearance.theme === 'system') applyAppearance();
    };
    
    systemThemeMedia.addEventListener('change', handleSystemChange);
    return () => {
      window.removeEventListener('ims_appearance_changed', applyAppearance);
      systemThemeMedia.removeEventListener('change', handleSystemChange);
    };
  }, []);

  // Dynamic Favicon Manager
  useEffect(() => {
    const favicon = document.getElementById('favicon-link');
    if (favicon) {
      if (userType === 'intern') {
        favicon.href = '/intern-favicon.png';
      } else {
        favicon.href = '/admin-favicon.png';
      }
    }
  }, [userType]);

  const handleSetUser = (u, type = 'staff') => {
    setUser(u);
    setUserType(localStorage.getItem('user_type'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_type');
    setUser(null);
    setUserType(null);
  };

  if (loading) return null;

  return (
    <NotificationProvider>
      <Router>
        <Routes>
          {/* Public Login */}
          <Route 
            path="/login" 
            element={
              user ? (
                userType === 'staff' ? <Navigate to="/dashboard" /> : <Navigate to="/intern/dashboard" />
              ) : (
                <Login setUser={handleSetUser} />
              )
            } 
          />

          {/* OAuth Callback Handlers */}
          <Route path="/auth/callback/google" element={<OAuthCallback setUser={handleSetUser} />} />

          {/* Intern Portal Protected Routes */}
          <Route 
            path="/intern/*" 
            element={
              user && userType === 'intern' ? (
                <InternLayout user={user} onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/intern/dashboard" />} />
                    <Route path="/dashboard" element={<InternDashboard />} />
                    <Route path="/profile" element={<InternProfile />} />
                    <Route path="/jobs" element={<InternBrowseJobs />} />
                    <Route path="/apply/:id" element={<ApplyJob />} />
                    <Route path="/applications" element={<MyApplications />} />
                    <Route path="*" element={<Navigate to="/intern/dashboard" />} />
                  </Routes>
                </InternLayout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />

          {/* Staff / Company Protected Routes */}
          <Route 
            path="/*" 
            element={
              user && userType === 'staff' ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Applications Management */}
                    <Route path="/applications" element={<AllApplications type="all" />} />
                    <Route path="/applications/new" element={<AllApplications type="new" />} />
                    <Route path="/applications/duplicates" element={<AllApplications type="duplicates" />} />
                    <Route path="/applications/spam" element={<AllApplications type="spam" />} />
                    <Route path="/applications/:id" element={<ApplicationDetail />} />
                    
                    {/* Job Board */}
                    <Route path="/job-posts" element={<JobPosts />} />
                    <Route path="/job-posts/new" element={<CreateJobPost />} />
                    <Route path="/job-posts/:id/edit" element={<EditJobPost />} />
                    
                    <Route path="/templates" element={<EmailTemplates />} />
                    
                    {/* Co-founder specific */}
                    {['COFOUNDER', 'ADMIN'].includes(user.role) && (
                        <Route path="/admin/users" element={<UserManagement />} />
                    )}
                    
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </Layout>
              ) : (
                  userType === 'intern' ? <Navigate to="/intern/dashboard" /> : <Navigate to="/login" />
              )
            } 
          />
        </Routes>
      </Router>
    </NotificationProvider>
  );
};

export default App;
