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
    bio: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    education_history: [],
    work_experience: [],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/intern/profile');
        const data = response.data;
        
        let edu = data.education_history || [];
        // Migration: if edu is empty but university exists, migrate it
        if (edu.length === 0 && data.university) {
          edu = [{
            school: data.university,
            degree: 'Bachelor\'s',
            major: '',
            graduation_year: data.graduation_year,
            gpa: data.gpa
          }];
        }

        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          linkedin_url: data.linkedin_url || '',
          github_url: data.github_url || '',
          portfolio_url: data.portfolio_url || '',
          education_history: edu,
          work_experience: data.work_experience || [],
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

  const handleArrayChange = (type, index, field, value) => {
    setFormData(prev => {
      const arr = [...prev[type]];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [type]: arr };
    });
  };

  const addArrayItem = (type) => {
    const newItem = type === 'education_history' 
      ? { school: '', degree: '', major: '', graduation_year: '', graduation_month: '', gpa: '', gpa_scale: '4.0' }
      : { company: '', position: '', start_date: '', end_date: '', description: '', is_current: false };
    
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));
  };

  const removeArrayItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put('/intern/profile', formData);
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

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (loading) return null;

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
      <header>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Profile Laboratory</h1>
        <p className="text-on-surface-variant font-medium text-base sm:text-lg">Define your professional identity to the recruitment algorithm.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Profile */}
        <div className="glass-card p-6 sm:p-8 md:p-10 rounded-[2.5rem] border-white space-y-8">
            <h3 className="text-xl sm:text-2xl font-black text-on-surface font-headline flex items-center gap-3">
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

        {/* Academic Credentials Section */}
        <div className="glass-card p-6 sm:p-8 md:p-10 rounded-[2.5rem] border-white space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-xl sm:text-2xl font-black text-on-surface font-headline flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">school</span>
                    Academic Credentials
                </h3>
                <button 
                    type="button"
                    onClick={() => addArrayItem('education_history')}
                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                >
                    <span className="material-symbols-outlined">add</span>
                </button>
            </div>
            
            <div className="space-y-10">
                {formData.education_history.map((edu, idx) => (
                    <div key={idx} className="relative p-5 sm:p-6 md:p-8 bg-white/40 rounded-3xl border border-slate-100 group animate-in zoom-in-95 duration-200">
                        <button 
                            type="button"
                            onClick={() => removeArrayItem('education_history', idx)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-rose-500/30"
                        >
                            <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">University / Institute</label>
                                <input 
                                    value={edu.school}
                                    onChange={(e) => handleArrayChange('education_history', idx, 'school', e.target.value)}
                                    className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Degree</label>
                                <input 
                                    value={edu.degree}
                                    onChange={(e) => handleArrayChange('education_history', idx, 'degree', e.target.value)}
                                    placeholder="e.g. Bachelor of Science"
                                    className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Major</label>
                                <input 
                                    value={edu.major}
                                    onChange={(e) => handleArrayChange('education_history', idx, 'major', e.target.value)}
                                    placeholder="e.g. Computer Science"
                                    className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Graduation Year</label>
                                    <input 
                                        type="number"
                                        value={edu.graduation_year}
                                        onChange={(e) => handleArrayChange('education_history', idx, 'graduation_year', e.target.value)}
                                        className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Month</label>
                                    <select 
                                        value={edu.graduation_month || ""}
                                        onChange={(e) => handleArrayChange('education_history', idx, 'graduation_month', e.target.value)}
                                        className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none cursor-pointer"
                                    >
                                        <option value="">Month</option>
                                        {months.map((m, i) => (
                                            <option key={m} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">GPA</label>
                                    <input 
                                        value={edu.gpa}
                                        onChange={(e) => handleArrayChange('education_history', idx, 'gpa', e.target.value)}
                                        className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Out of</label>
                                    <select 
                                        value={edu.gpa_scale || "4.0"}
                                        onChange={(e) => handleArrayChange('education_history', idx, 'gpa_scale', e.target.value)}
                                        className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none cursor-pointer"
                                    >
                                        <option value="4.0">4.0</option>
                                        <option value="5.0">5.0</option>
                                        <option value="10.0">10.0</option>
                                        <option value="100">100 (Percentage)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {formData.education_history.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-slate-400 font-bold text-sm">No academic credentials registered.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Work Experience Section */}
        <div className="glass-card p-6 sm:p-8 md:p-10 rounded-[2.5rem] border-white space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-xl sm:text-2xl font-black text-on-surface font-headline flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">work</span>
                    Work Experience
                </h3>
                <button 
                    type="button"
                    onClick={() => addArrayItem('work_experience')}
                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                >
                    <span className="material-symbols-outlined">add_business</span>
                </button>
            </div>
            
            <div className="space-y-10">
                {formData.work_experience.map((exp, idx) => (
                    <div key={idx} className="relative p-5 sm:p-6 md:p-8 bg-white/40 rounded-3xl border border-slate-100 group animate-in zoom-in-95 duration-200">
                        <button 
                            type="button"
                            onClick={() => removeArrayItem('work_experience', idx)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-rose-500/30"
                        >
                            <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Company</label>
                                <input 
                                    value={exp.company}
                                    onChange={(e) => handleArrayChange('work_experience', idx, 'company', e.target.value)}
                                    className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Position</label>
                                <input 
                                    value={exp.position}
                                    onChange={(e) => handleArrayChange('work_experience', idx, 'position', e.target.value)}
                                    className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                                <input 
                                    type="date"
                                    value={exp.start_date}
                                    onChange={(e) => handleArrayChange('work_experience', idx, 'start_date', e.target.value)}
                                    className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                                <div className="space-y-3">
                                    {!exp.is_current ? (
                                        <input 
                                            type="date"
                                            value={exp.end_date}
                                            onChange={(e) => handleArrayChange('work_experience', idx, 'end_date', e.target.value)}
                                            className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none animate-in fade-in duration-200"
                                        />
                                    ) : (
                                        <div className="w-full h-[46px] flex items-center px-5 bg-primary/5 border border-primary/20 rounded-xl text-primary text-xs font-bold gap-2 animate-in slide-in-from-left-2 duration-200">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            Currently Operating
                                        </div>
                                    )}
                                    <label className="flex items-center gap-2 cursor-pointer group w-fit">
                                        <input 
                                            type="checkbox"
                                            checked={exp.is_current}
                                            onChange={(e) => handleArrayChange('work_experience', idx, 'is_current', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary transition-colors">I currently work here</span>
                                    </label>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea 
                                    value={exp.description}
                                    onChange={(e) => handleArrayChange('work_experience', idx, 'description', e.target.value)}
                                    rows={3}
                                    className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3 text-sm font-medium outline-none resize-none"
                                    placeholder="Summary of responsibilities and achievements..."
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {formData.work_experience.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-slate-400 font-bold text-sm">No work experience registered.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Professional Connectivity */}
        <div className="glass-card p-6 sm:p-8 md:p-10 rounded-[2.5rem] border-white space-y-8">
            <h3 className="text-xl sm:text-2xl font-black text-on-surface font-headline flex items-center gap-3">
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
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">GitHub URL</label>
                    <input 
                        name="github_url"
                        value={formData.github_url}
                        onChange={handleChange}
                        className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 focus:border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Portfolio URL (Optional)</label>
                    <input 
                        name="portfolio_url"
                        value={formData.portfolio_url}
                        onChange={handleChange}
                        className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-primary/20 focus:border-primary"
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
                className="hero-gradient text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
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
