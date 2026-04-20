import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const ApplyJob = () => {
  const { showNotification } = useNotification();
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const fileInputRef = useRef(null);

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/job-posts/${id}`);
        setJob(response.data);
        
        // Prefill from user data
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser) {
          setFormData({
            full_name: `${currentUser.first_name} ${currentUser.last_name}`,
            email: currentUser.email,
            phone: currentUser.phone || '',
          });
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
        showNotification('Please attach your resume to continue deployment.', 'error');
        return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('resume', resume);
      if (coverLetter) fd.append('cover_letter', coverLetter);
      fd.append('full_name', formData.full_name);
      fd.append('email', formData.email);
      fd.append('phone', formData.phone);

      await api.post(`/intern/apply/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showNotification('Application protocol deployed successfully!', 'success');
      navigate('/intern/applications');
    } catch (error) {
      console.error('Submission error:', error);
      showNotification(error.response?.data?.detail || 'Handshake failed. Protocol termination.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (!job) return <div>Position not found in system logs.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20 mb-4 inline-block">
            Stream: {job.category}
        </span>
        <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2 leading-tight">
          Apply for {job.title}
        </h1>
        <p className="text-on-surface-variant font-medium text-lg">Initialize your application protocol for this stream.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 space-y-8">
          {job.applied ? (
            <div className="glass-card p-16 rounded-[3rem] border-emerald-100 bg-emerald-50/30 flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                    <span className="material-symbols-outlined text-5xl">verified</span>
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-emerald-950 font-headline">Protocol Already Active</h2>
                    <p className="text-emerald-800/60 font-medium max-w-md mx-auto">You have successfully initialized your application for this stream. Our team is currently reviewing your artifacts.</p>
                </div>
                <button 
                    onClick={() => navigate('/intern/applications')}
                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all"
                >
                    View Protocol Status
                </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Core Identity Check */}
              <div className="glass-card p-10 rounded-[2.5rem] border-white space-y-8">
                  <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">person_check</span>
                      Identity Verification
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Display Name</label>
                          <input 
                              required
                              value={formData.full_name}
                              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                              className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Contact Email</label>
                          <input 
                              readOnly
                              value={formData.email}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold opacity-60 cursor-not-allowed"
                          />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Phone Protocol</label>
                          <input 
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 outline-none"
                          />
                      </div>
                  </div>
              </div>

              {/* Documentation Upload */}
              <div className="glass-card p-10 rounded-[2.5rem] border-white space-y-8">
                  <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">upload_file</span>
                      Documentation Logs
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Resume */}
                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Resume / CV (Required)</label>
                          <div className="relative group">
                              <input 
                                  type="file" 
                                  accept=".pdf,.doc,.docx"
                                  onChange={(e) => setResume(e.target.files[0])}
                                  className="hidden" 
                                  id="resume-upload"
                              />
                              <label 
                                  htmlFor="resume-upload" 
                                  className={`flex flex-col items-center justify-center gap-4 py-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${resume ? 'bg-success/5 border-success/30' : 'bg-slate-50/50 border-slate-200 hover:border-primary/40 hover:bg-primary/5'}`}
                              >
                                  <span className={`material-symbols-outlined text-3xl ${resume ? 'text-success' : 'text-slate-400'}`}>
                                      {resume ? 'check_circle' : 'file_upload'}
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                                      {resume ? resume.name : 'Select PDF/DOCX'}
                                  </span>
                              </label>
                          </div>
                      </div>

                      {/* Cover Letter */}
                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Cover Letter (Optional)</label>
                          <div className="relative group">
                              <input 
                                  type="file" 
                                  accept=".pdf,.doc,.docx"
                                  onChange={(e) => setCoverLetter(e.target.files[0])}
                                  className="hidden" 
                                  id="cl-upload"
                              />
                              <label 
                                  htmlFor="cl-upload" 
                                  className={`flex flex-col items-center justify-center gap-4 py-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${coverLetter ? 'bg-success/5 border-success/30' : 'bg-slate-50/50 border-slate-200 hover:border-primary/40 hover:bg-primary/5'}`}
                              >
                                  <span className={`material-symbols-outlined text-3xl ${coverLetter ? 'text-success' : 'text-slate-400'}`}>
                                      {coverLetter ? 'check_circle' : 'history_edu'}
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                                      {coverLetter ? coverLetter.name : 'Select PDF/DOCX'}
                                  </span>
                              </label>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex justify-end gap-6 pt-4">
                  <button 
                      type="button" 
                      onClick={() => navigate(-1)}
                      className="px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-on-surface-variant hover:bg-slate-100 transition-all"
                  >
                      Protocol Cancel
                  </button>
                  <button 
                      type="submit" 
                      disabled={submitting}
                      className="hero-gradient text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                      {submitting ? 'Deploying...' : 'Deploy Application'}
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  </button>
              </div>
            </form>
          )}
        </div>

        <div className="lg:col-span-5 space-y-8 sticky top-8">
            {job.media_url && (
                <div className="glass-card rounded-[2.5rem] overflow-hidden border-white h-64 relative shadow-lg shadow-primary/5">
                    {(() => {
                        const mUrl = getMediaUrl(job.media_url);
                        return mUrl.endsWith('.mp4') || mUrl.endsWith('.webm') ? (
                            <video src={mUrl} className="w-full h-full object-cover" autoPlay muted loop />
                        ) : (
                            <img src={mUrl} alt={job.title} className="w-full h-full object-cover" />
                        );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                </div>
            )}

            <div className="glass-card p-10 rounded-[2.5rem] border-white space-y-8">
                <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">data_object</span>
                    Stream Context
                </h3>
                
                {job.description && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">target</span>
                            Mission Objective
                        </h4>
                        <p className="text-sm text-on-surface-variant leading-relaxed font-medium">{job.description}</p>
                    </div>
                )}

                {job.requirements && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">task_alt</span>
                            Protocol Requirements
                        </h4>
                        <div className="text-sm text-on-surface-variant leading-relaxed font-medium whitespace-pre-wrap">
                            {job.requirements}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100/50">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Location</p>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs text-primary">public</span>
                            <span className="text-xs font-black text-on-surface">{job.location || 'Remote'}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Annual Stipend</p>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs text-primary">payments</span>
                            <span className="text-xs font-black text-on-surface">{job.stipend_range || 'Competitive'}</span>
                        </div>
                    </div>
                    {job.tags && (
                        <div className="col-span-2 pt-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Tech Stack / Domain</p>
                            <div className="flex flex-wrap gap-2">
                                {job.tags.split(',').map((t, i) => (
                                    <span key={i} className="px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-lg text-[9px] font-black uppercase tracking-widest">{t.trim()}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyJob;
