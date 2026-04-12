import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

const ResetPassword = () => {
  const { showNotification } = useNotification();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match established pattern.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
        two_fa_code: twoFaCode || undefined
      });
      showNotification('Success: Security credentials updated.', 'success');
      navigate('/login');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.detail === '2FA_REQUIRED') {
        setRequires2FA(true);
      } else {
        setError(err.response?.data?.detail || 'Reset failure. The signal token may be invalid or expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-primary/20">
      <div className="w-full max-w-[520px] space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-8 text-primary">
             <span className="material-symbols-outlined text-4xl">vpn_key</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter font-headline">Credential Update</h1>
          <p className="text-slate-500 font-medium">Verified individuals may now establish new security credentials for system access.</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border-white shadow-2xl shadow-slate-200/40">
           <form onSubmit={handleReset} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border-1 border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-3">
                   <span className="material-symbols-outlined text-sm">error</span>
                   {error}
                </div>
              )}

              {/* Step 1: Token & New Password */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Authentication Token</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-slate-900 font-black tracking-[1em] text-center focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-lg placeholder-slate-200"
                    placeholder="000000"
                  />
                  <p className="text-[9px] text-slate-400 font-medium italic px-1">Enter the 6-digit verification code dispatched to your email.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-slate-900 font-bold focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Pattern</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-slate-900 font-bold focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: 2FA Verification (if required) */}
              {requires2FA && (
                <div className="p-8 bg-primary/[0.03] border-2 border-primary/10 rounded-3xl space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-4 text-primary">
                       <span className="material-symbols-outlined text-2xl">security</span>
                       <h3 className="text-xs font-black uppercase tracking-widest">Secondary Layer Required</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                       Enhanced security detection: This account is protected by Two-Factor Authentication. Please enter your authenticator app code to commit changes.
                    </p>
                    <input
                      type="text"
                      maxLength="6"
                      required
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-14 bg-white border-2 border-primary/20 rounded-2xl px-6 text-slate-900 font-black tracking-[0.8em] text-center focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-lg"
                      placeholder="000000"
                    />
                </div>
              )}

              <div className="pt-4 space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest shadow-slate-200"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Commit New Credentials</span>
                      <span className="material-symbols-outlined text-sm">security_update_good</span>
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Return to Base Login
                </button>
              </div>
           </form>
        </div>
        
        <footer className="text-center text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">
           LoopLab Identity Management / Security Tier 1
        </footer>
      </div>
    </div>
  );
};

export default ResetPassword;
