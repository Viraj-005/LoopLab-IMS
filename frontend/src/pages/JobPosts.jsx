import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';

const JobPosts = () => {
  const { showNotification } = useNotification();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Assuming backend is on port 8000 and the route is /uploads/
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  const fetchJobs = async () => {
    try {
      const response = await api.get('/job-posts/');
      setJobs(response.data.items);
    } catch (error) {
      console.error("Error fetching job posts:", error);
      showNotification("Failed to synchronize recruitment streams.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async () => {
    if (!jobToDelete) return;
    try {
      await api.delete(`/job-posts/${jobToDelete.id}`);
      showNotification(`Protocol for ${jobToDelete.title} terminated successfully.`, "success");
      fetchJobs(); // Refresh list
    } catch (error) {
      showNotification("Authorization failure: Unable to terminate protocol.", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    }
  };

  const openDeleteConfirmation = (job) => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setIsViewModalOpen(true);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Live': return 'bg-success/10 text-success ring-success/20';
      case 'Draft': return 'bg-slate-100 text-slate-500 ring-slate-400/20';
      case 'Closed': return 'bg-danger/10 text-danger ring-danger/20';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Job Board</h1>
          <p className="text-on-surface-variant font-medium text-lg">Manage active intern openings and recruitment streams.</p>
        </div>
        <Link to="/job-posts/new">
          <button className="hero-gradient text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 tonal-transition flex items-center gap-3">
             <span className="material-symbols-outlined text-sm">add</span>
             Initialize Opening
          </button>
        </Link>
      </header>

      <section className="glass-card rounded-[3rem] shadow-2xl shadow-primary/5 overflow-hidden border-white">
        <div className="p-10 border-b border-slate-200/30 flex justify-between items-end bg-white/40">
          <div>
            <h3 className="text-2xl font-black text-on-surface font-headline mb-1">Active Streams</h3>
            <p className="text-[10px] font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">Tracking {jobs.length} recruitment protocols</p>
          </div>
          <div className="flex items-center bg-white/80 border border-slate-200/50 px-6 py-3 rounded-2xl shadow-sm">
            <span className="material-symbols-outlined text-lg text-slate-400 mr-3">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm w-64 p-0 font-medium" placeholder="Search opening..." type="text" />
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                {['Position / Category', 'Location', 'Status', 'Applications', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-body">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-white/60 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl kinetic-gradient flex items-center justify-center shadow-lg text-white cursor-pointer" onClick={() => handleViewDetails(job)}>
                        <span className="material-symbols-outlined text-lg">{
                          job.category === 'UX/UI Design' ? 'palette' : 
                          job.category === 'AI Research' ? 'psychology' : 
                          job.category === 'Marketing' ? 'campaign' :
                          job.category === 'Operations' ? 'settings_suggest' : 'terminal'
                        }</span>
                      </div>
                      <div className="cursor-pointer" onClick={() => handleViewDetails(job)}>
                        <p className="text-base font-black text-on-surface group-hover:text-primary transition-colors">{job.title}</p>
                        <p className="text-xs text-on-surface-variant font-bold opacity-70 uppercase tracking-widest">{job.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-sm text-on-surface-variant font-bold">{job.location}</td>
                  <td className="px-10 py-8">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${getStatusStyle(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                     <p className="text-sm font-black text-on-surface">{job.application_count} <span className="text-xs opacity-40 font-bold ml-1">Received</span></p>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-3">
                      <Link to={`/job-posts/${job.id}/edit`} className="p-3 bg-white border border-slate-200 rounded-xl text-on-surface-variant hover:text-primary hover:border-primary tonal-transition">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </Link>
                      <button 
                        onClick={() => openDeleteConfirmation(job)}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-on-surface-variant hover:text-danger hover:border-danger tonal-transition"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-10 py-20 text-center opacity-40">
                    <span className="material-symbols-outlined text-5xl mb-4">work_off</span>
                    <p className="text-xs font-black uppercase tracking-widest">No active protocols initialized</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* View Modal */}
      {isViewModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsViewModalOpen(false)}></div>
          <div className="relative bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative h-64 bg-slate-100 overflow-hidden">
              {selectedJob.media_url ? (
                (() => {
                  const mUrl = getMediaUrl(selectedJob.media_url);
                  return mUrl.endsWith('.mp4') || mUrl.endsWith('.webm') ? (
                    <video src={mUrl} className="w-full h-full object-cover" autoPlay muted loop />
                  ) : (
                    <img src={mUrl} alt={selectedJob.title} className="w-full h-full object-cover" />
                  );
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                  <span className="material-symbols-outlined text-6xl text-slate-200">image_not_supported</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-10 left-12">
                <span className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">
                  {selectedJob.category}
                </span>
                <h2 className="text-4xl font-black text-white font-headline">{selectedJob.title}</h2>
              </div>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-12 space-y-10">
              <div className="grid grid-cols-3 gap-8">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Location</p>
                  <p className="text-sm font-bold text-on-surface">{selectedJob.location}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Stipend</p>
                  <p className="text-sm font-bold text-on-surface">{selectedJob.stipend_range || 'Not Disclosed'}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Capacity</p>
                  <p className="text-sm font-bold text-on-surface">{selectedJob.capacity} Seats Available</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-black text-on-surface font-headline uppercase tracking-tight">Mission Description</h4>
                <div className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {selectedJob.description}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-black text-on-surface font-headline uppercase tracking-tight">Core Requirements</h4>
                <div className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {selectedJob.requirements}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol initiated on {new Date(selectedJob.created_at).toLocaleDateString()}</p>
                 <div className="flex gap-4">
                    <Link to={`/job-posts/${selectedJob.id}/edit`} className="hero-gradient text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Modify Protocol</Link>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Terminate Recruitment Protocol"
        message={`WARNING: You are about to permanently terminate the recruitment stream for ${jobToDelete?.title}. All associated data will be archived/removed from active views.`}
        confirmText="Confirm Termination"
        expectedName={jobToDelete?.title}
        itemName="Opening Title"
      />
    </div>
  );
};

export default JobPosts;
