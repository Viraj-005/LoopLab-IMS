import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const InternBrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Fetch life job posts
        const response = await api.get('/job-posts/?status=Live');
        setJobs(response.data.items || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  const getTagColor = (text) => {
    if (!text) return 'slate';
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 45%)`;
  };

  if (loading) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Open Streams</h1>
        <p className="text-on-surface-variant font-medium text-base sm:text-lg">Browse active internship opportunities and deploy your professional protocol.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
        {jobs.map((job) => {
          const seatsLeft = Math.max(0, job.capacity - (job.application_count || 0));
          const tags = job.tags ? job.tags.split(',').map(t => t.trim()) : [];
          
          return (
            <div key={job.id} className="glass-card rounded-[2.5rem] border-white hover:border-primary/20 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500 flex flex-col group relative overflow-hidden bg-white/70 backdrop-blur-xl">
              
              {/* Media Header with Strategic Overlays */}
              <div className="relative h-64 overflow-hidden">
                {job.media_url ? (
                  (() => {
                    const mUrl = getMediaUrl(job.media_url);
                    return mUrl.endsWith('.mp4') || mUrl.endsWith('.webm') ? (
                      <video src={mUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" autoPlay muted loop />
                    ) : (
                      <img 
                        src={mUrl} 
                        alt={job.title} 
                        loading="lazy"
                        onLoad={(e) => e.target.style.opacity = 1}
                        className="w-full h-full object-cover opacity-0 transition-all duration-1000 group-hover:scale-110" 
                      />
                    );
                  })()
                ) : (
                  <div className="w-full h-full kinetic-gradient opacity-10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary opacity-20">rocket_launch</span>
                  </div>
                )}
                
                {/* Visual Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent"></div>
                
                {/* Floating Category Tag */}
                <div 
                    className="absolute top-6 left-6 px-4 py-2 backdrop-blur-md border border-white/20 rounded-xl"
                    style={{ backgroundColor: `${getTagColor(job.category).replace(')', ', 0.2)')}` }}
                >
                   <p className="text-[10px] font-black text-white uppercase tracking-widest">{job.category}</p>
                </div>

                {/* Occupancy Indicator */}
                {!job.applied && (
                  <div className={`absolute top-6 right-6 px-4 py-2 backdrop-blur-md border rounded-xl flex items-center gap-2 ${seatsLeft <= 2 ? 'bg-red-500/20 border-red-500/30 text-red-100' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${seatsLeft <= 2 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                    <p className="text-[10px] font-black uppercase tracking-widest">
                       {seatsLeft > 0 ? `${seatsLeft} Slots Available` : 'Stream Occupied'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Core Content */}
              <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col">
                  <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0"
                            style={{ backgroundColor: getTagColor(job.category) }}
                          >
                              <span className="material-symbols-outlined text-xl">
                                {
                                  job.category === 'UX/UI Design' ? 'palette' : 
                                  job.category === 'AI Research' ? 'psychology' : 
                                  job.category === 'Marketing' ? 'campaign' :
                                  job.category === 'Operations' ? 'settings_suggest' : 'terminal'
                                }
                              </span>
                          </div>
                          <div className="min-w-0">
                             <h3 className="text-xl sm:text-2xl font-black text-on-surface font-headline leading-tight truncate group-hover:text-primary transition-colors">
                                {job.title}
                             </h3>
                          </div>
                      </div>

                      {/* Job Tags Stream */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                           {tags.map((tag, idx) => {
                             const color = getTagColor(tag);
                             return (
                               <span 
                                 key={idx}
                                 className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105"
                                 style={{ 
                                   backgroundColor: color.replace(')', ', 0.1)'), 
                                   borderColor: color.replace(')', ', 0.3)'),
                                   color: color
                                 }}
                               >
                                 {tag}
                               </span>
                             );
                           })}
                        </div>
                      )}

                      <p className="text-sm text-on-surface-variant line-clamp-3 font-medium opacity-80 leading-relaxed italic border-l-2 border-slate-100 pl-4 py-1">
                          {job.description}
                      </p>

                      {/* Stream Metadata Detail Grid */}
                      <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100/50">
                         <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Location</p>
                            <div className="flex items-center gap-2">
                               <span className="material-symbols-outlined text-xs text-primary">public</span>
                               <span className="text-[11px] font-black text-on-surface">{job.location}</span>
                            </div>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Annual Stipend</p>
                            <div className="flex items-center gap-2">
                               <span className="material-symbols-outlined text-xs text-primary">payments</span>
                               <span className="text-[11px] font-black text-on-surface">{job.stipend_range || 'Competitive'}</span>
                            </div>
                         </div>
                      </div>
                  </div>

                  {/* Primary Trigger */}
                  <div className="mt-10">
                      {job.applied ? (
                        <button 
                            onClick={() => navigate('/intern/applications')}
                            className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined text-sm font-bold">verified</span>
                            <span className="text-xs font-black uppercase tracking-widest">Protocol Sync Complete</span>
                        </button>
                      ) : (
                        <button 
                            onClick={() => navigate(`/intern/apply/${job.id}`)}
                            className="w-full h-14 sm:h-16 bg-slate-900 text-white rounded-2xl hover:bg-black hover:shadow-2xl hover:shadow-primary/20 transition-all flex items-center justify-center border border-slate-800 relative group/btn overflow-hidden"
                        >
                            <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.2em] group-hover/btn:mr-4 transition-all">Initialize Application</span>
                            <span className="material-symbols-outlined text-sm absolute right-12 opacity-0 group-hover/btn:opacity-100 group-hover/btn:right-10 transition-all duration-300">arrow_forward</span>
                        </button>
                      )}
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {jobs.length === 0 && (
          <div className="glass-card p-20 rounded-[3rem] border-white flex flex-col items-center justify-center text-center space-y-6 opacity-60">
              <span className="material-symbols-outlined text-7xl text-slate-200">searching_hands</span>
              <p className="text-xl font-bold text-on-surface-variant">No active job streams currently broadcasting.</p>
          </div>
      )}
    </div>
  );
};

export default InternBrowseJobs;
