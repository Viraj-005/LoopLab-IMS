import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const InternProfile = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    university: '',
    graduation_year: '',
    gpa: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/intern/profile');
        const data = response.data;
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          university: data.university || '',
          graduation_year: data.graduation_year || '',
          gpa: data.gpa || '',
          bio: data.bio || '',
          linkedin_url: data.linkedin_url || '',
          github_url: data.github_url || '',
          portfolio_url: data.portfolio_url || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put('/intern/profile', formData);
      // Update local user storage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...response.data }));
      showNotification('Profile protocol synchronized successfully.', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Failed to synchronize profile. Check system logs.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Profile Laboratory</h1>
        <p className="text-on-surface-variant font-medium text-lg">Define your professional identity to the recruitment algorithm.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Profile */}
        <div className="glass-card p-10 rounded-[2.5rem] border-white space-y-8">
            <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">badge</span>
                Core Identity
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">First Name</label>
                    <input 
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Last Name</label>
                    <input 
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Contact Number</label>
                    <input 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 234 567 890"
                        className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
            </div>
        </div>

        {/* Academic Profile */}
        <div className="glass-card p-10 rounded-[2.5rem] border-white space-y-8">
            <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">school</span>
                Academic Credentials
            </h3>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">University / Institute</label>
                    <input 
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Graduation Year</label>
                        <input 
                            type="number"
                            name="graduation_year"
                            value={formData.graduation_year}
                            onChange={handleChange}
                            className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Current GPA</label>
                        <input 
                            name="gpa"
                            value={formData.gpa}
                            onChange={handleChange}
                            placeholder="e.g. 3.85"
                            className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Professional Connectivity */}
        <div className="glass-card p-10 rounded-[2.5rem] border-white space-y-8">
            <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">link</span>
                Protocol Links
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">LinkedIn URL</label>
                    <input 
                        name="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={handleChange}
                        className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">GitHub / Portfolio URL</label>
                    <input 
                        name="github_url"
                        value={formData.github_url}
                        onChange={handleChange}
                        className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Professional Summary</label>
                <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-white/60 border border-slate-200 rounded-3xl px-6 py-4 text-sm font-medium focus:ring-2 ring-primary/20 focus:border-primary outline-none resize-none"
                    placeholder="Tell HR about your professional mission..."
                />
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <button 
                type="submit" 
                disabled={saving}
                className="hero-gradient text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
            >
                {saving ? 'Synchronizing...' : 'Update Protocol'}
                <span className="material-symbols-outlined text-sm">sync</span>
            </button>
        </div>
      </form>
    </div>
  );
};

export default InternProfile;
