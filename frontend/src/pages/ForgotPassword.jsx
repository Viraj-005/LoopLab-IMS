import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      // Wait a bit then navigate to reset
      setTimeout(() => {
        navigate('/reset-password');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'System failure in dispatching reset protocol.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-primary/20">
      <div className="w-full max-w-[480px] space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-8">
             <span className="material-symbols-outlined text-4xl text-slate-900">lock_reset</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter font-headline">Reset Protocol</h1>
          <p className="text-slate-500 font-medium">Initialize the secure password recovery process by verifying your institutional identity.</p>
        </div>

        <div className="glass-card p-10 rounded-[2.5rem] border-white shadow-2xl shadow-slate-200/50">
          {message ? (
             <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
                   <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                </div>
                <div className="space-y-2">
                   <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Signal Dispatched</p>
                   <p className="text-sm font-medium text-slate-500">{message}</p>
                </div>
                <div className="pt-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 animate-pulse">Initializing reset bridge...</p>
                </div>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 bg-red-50 border-1 border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-3">
                   <span className="material-symbols-outlined text-sm">report</span>
                   {error}
                </div>
              )}
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Coordinates</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">alternate_email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[64px] bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 text-slate-900 font-bold focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-sm placeholder-slate-300"
                    placeholder="name@looplab.io"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[64px] bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Dispatch Reset Signal</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </>
                )}
              </button>

              <button 
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Return to Login
              </button>
            </form>
          )}
        </div>

        <footer className="text-center text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">
           &copy; 2026 LoopLab IMS / Intelligence Group
        </footer>
      </div>
    </div>
  );
};

export default ForgotPassword;
