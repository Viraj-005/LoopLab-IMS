import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const OAuthCallback = ({ setUser }) => {
  const navigate = useNavigate();

  const hasHandledCallback = React.useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasHandledCallback.current) return;
      hasHandledCallback.current = true;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          // Exchange code for tokens via backend
          const response = await api.get(`/auth/intern/google/callback?code=${code}`);
          const { access_token, refresh_token, intern } = response.data;

          localStorage.setItem('token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          localStorage.setItem('user', JSON.stringify(intern));
          localStorage.setItem('user_type', 'intern');

          setUser(intern);
          
          // Redirect to intern dashboard or profile setup
          if (!intern.profile_complete) {
            navigate('/intern/profile');
          } else {
            navigate('/intern/dashboard');
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          navigate('/login?error=oauth_failed');
        }
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-bold text-on-surface animate-pulse">Authenticating with Google...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
