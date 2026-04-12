import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = ({ setUser }) => {
  const [activeTab, setActiveTab] = useState('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.requires_2fa) {
        setRequires2FA(true);
        setTempToken(response.data.temp_token);
        setLoading(false);
        return;
      }

      const { access_token, refresh_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_type', 'staff');
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Access to the management system has been denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/2fa/verify-login', {
        code: twoFACode,
        temp_token: tempToken
      });

      const { access_token, refresh_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_type', 'staff');
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid security code. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleInternLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    const scope = 'email profile openid';
    const responseType = 'code';
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="h-screen bg-white flex flex-col md:flex-row overflow-hidden font-body selection:bg-primary/20">
      
      {/* LEFT SIDE: BRADING & CONTEXT (Visible on MD+) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-slate-900 relative items-center justify-center p-12 lg:p-24 overflow-hidden">
        {/* Professional Ambient Background */}
        <div className="absolute inset-0 z-0">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/30 to-slate-900"></div>
           <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full"></div>
           <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 blur-[120px] rounded-full"></div>
           {/* Mesh Texture */}
           <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="relative z-10 max-w-xl text-white space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
           <div className="space-y-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center shadow-2xl">
                 <span className="material-symbols-outlined text-4xl text-white">deployed_code</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.05] font-headline">
                Recruitment <br />
                <span className="text-primary-light">Intelligence</span> <br />
                Redefined.
              </h1>
           </div>
           
           <p className="text-lg lg:text-xl text-slate-300 font-medium leading-relaxed opacity-80 max-w-lg">
             Manage, analyze, and scale your talent pipeline with the industry's most advanced internal management strategy.
           </p>

           <div className="flex items-center gap-12 pt-10 border-t border-white/10">
              <div className="space-y-1">
                 <p className="text-3xl font-black text-white">10k+</p>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Applications Scanned</p>
              </div>
              <div className="space-y-1">
                 <p className="text-3xl font-black text-white">99.9%</p>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Uptime</p>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN PORTAL */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        
        {/* Mobile Logo */}
        <div className="md:hidden mb-12 flex flex-col items-center">
            <div className="w-16 h-16 kinetic-gradient rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-primary/20">
               <span className="material-symbols-outlined text-3xl">deployed_code</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter font-headline">LOOPLAB/IMS</h2>
        </div>

        <div className="w-full max-w-[440px] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="space-y-4 text-center md:text-left">
            <h2 className="hidden md:block text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter font-headline">Welcome Back</h2>
            <p className="text-slate-500 font-medium text-base lg:text-lg leading-relaxed">Select your entry protocol to access the recruitment ecosystem.</p>
          </div>

          {/* Segmented Control (Tabs) */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex h-14 relative">
              <div 
                className={`absolute h-[calc(100%-12px)] w-[calc(50%-6px)] bg-white rounded-xl shadow-lg shadow-slate-200 transition-all duration-300 ${activeTab === 'intern' ? 'left-[calc(50%)]' : 'left-[6px]'}`}
              ></div>
              <button 
                onClick={() => setActiveTab('staff')}
                className={`relative z-10 flex-1 h-full text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'staff' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-600'}`}
              >
                Internal Staff
              </button>
              <button 
                onClick={() => setActiveTab('intern')}
                className={`relative z-10 flex-1 h-full text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'intern' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-600'}`}
              >
                Intern Portal
              </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 animate-in slide-in-from-right-4 duration-500">
               <span className="material-symbols-outlined text-red-500 text-sm">error</span>
               <p className="text-xs font-bold text-red-800 leading-snug">{error}</p>
            </div>
          )}

          {activeTab === 'staff' ? (
            requires2FA ? (
               <form onSubmit={handleVerify2FA} className="space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="space-y-4 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                       <span className="material-symbols-outlined text-3xl">shield_lock</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 font-headline">Two-Factor Required</h3>
                    <p className="text-xs font-medium text-slate-500">Identify verified. Enter the 6-digit security code from your authenticator app.</p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      maxLength="6"
                      required
                      autoFocus
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-[64px] bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-3xl font-black tracking-[0.5em] text-slate-900 focus:outline-none focus:border-primary/50 focus:bg-white transition-all placeholder-slate-200"
                      placeholder="000000"
                    />
                  </div>

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={loading || twoFACode.length < 6}
                      className="w-full h-[60px] bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Verify & Unlock</span>
                          <span className="material-symbols-outlined text-sm">verified_user</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRequires2FA(false)}
                      className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                      Back to Login
                    </button>
                  </div>
               </form>
            ) : (
              <form onSubmit={handleStaffLogin} className="space-y-5">
                {/* ... existing fields ... */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[56px] bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 text-slate-900 font-bold focus:outline-none focus:border-primary/50 focus:bg-primary/[0.02] transition-all text-sm placeholder-slate-300"
                    placeholder="name@looplab.io"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                  <button 
                    type="button" 
                    onClick={() => navigate('/forgot-password')}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">lock</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[56px] bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-16 text-slate-900 font-bold focus:outline-none focus:border-primary/50 focus:bg-primary/[0.02] transition-all text-sm placeholder-slate-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[60px] bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                     <span className="material-symbols-outlined text-xl">how_to_reg</span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 px-4 leading-relaxed">
                    Intern applicants must authenticate using the secure <span className="text-blue-700 font-black">Google Identity Pipeline</span> for automated profile synchronization.
                  </p>
               </div>

               <button 
                onClick={handleInternLogin}
                className="w-full h-[60px] bg-white border-2 border-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-50 hover:border-slate-200 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-[11px] uppercase tracking-widest shadow-sm"
              >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.23l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sync with Google Identity</span>
              </button>
            </div>
          )}

          <footer className="pt-8 text-center text-slate-300">
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                &copy; 2026 LoopLab IMS / Intelligence Group
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
