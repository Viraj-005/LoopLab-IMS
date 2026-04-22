import React, { useState, useEffect } from 'react';
import { 
    Loader2, 
    Building2, 
    Calendar, 
    Hash, 
    FileText, 
    CheckCircle2, 
    XCircle,
    ArrowUpRight,
    Download,
    History,
    FileSearch,
    Eye,
    ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Preview Management
  const [previewUrl, setPreviewUrl] = useState(null);
  const [clPreviewUrl, setClPreviewUrl] = useState(null);
  const [activePreview, setActivePreview] = useState('cv'); // 'cv' or 'cover_letter'

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.get('/intern/applications');
        setApplications(response.data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
    return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (clPreviewUrl) URL.revokeObjectURL(clPreviewUrl);
    };
  }, []);

  const handleViewDetails = async (appId) => {
    setLoadingDetail(true);
    setShowModal(true);
    setActivePreview('cv');
    
    // Cleanup previous object URLs
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (clPreviewUrl) URL.revokeObjectURL(clPreviewUrl);
    setPreviewUrl(null);
    setClPreviewUrl(null);

    try {
        const response = await api.get(`/intern/applications/${appId}`);
        const app = response.data;
        setSelectedApp(app);

        // Initiate Artifact Streams
        const cvPromise = api.get(`/intern/applications/${appId}/cv`, { responseType: 'blob' })
            .then(res => {
                const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                setPreviewUrl(url);
            }).catch(e => console.error("CV stream failure:", e));

        const clPromise = app.cover_letter_path 
            ? api.get(`/intern/applications/${appId}/cover-letter`, { responseType: 'blob' })
                .then(res => {
                    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                    setClPreviewUrl(url);
                }).catch(e => console.error("CL stream failure:", e))
            : Promise.resolve();

        await Promise.all([cvPromise, clPromise]);
    } catch (error) {
        console.error("Failed to fetch protocol details:", error);
    } finally {
        setLoadingDetail(false);
    }
  };

  const closeModal = () => {
      setShowModal(false);
      // Revoke URLs to prevent leaks
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (clPreviewUrl) URL.revokeObjectURL(clPreviewUrl);
      setPreviewUrl(null);
      setClPreviewUrl(null);
      setSelectedApp(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleDownload = async (type) => {
      if (!selectedApp) return;
      const endpoint = type === 'cv' ? 'cv' : 'cover-letter';
      const filename = type === 'cv' 
        ? (selectedApp.cv_original_filename || 'resume.pdf') 
        : (selectedApp.cover_letter_original_filename || 'cover_letter.pdf');

      try {
          const response = await api.get(`/intern/applications/${selectedApp.id}/${endpoint}`, {
              responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
      } catch (error) {
          console.error(`Failed to extract ${type}:`, error);
      }
  };

  const handleOpenInNewTab = (type) => {
      const url = type === 'cv' ? previewUrl : clPreviewUrl;
      if (url) {
          window.open(url, '_blank');
      }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Accessing Protocol Database</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
      <header>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Protocol History</h1>
        <p className="text-on-surface-variant font-medium text-base sm:text-lg">Tracks your active recruitment streams and status logs.</p>
      </header>

      {applications.length === 0 ? (
          <div className="glass-card p-20 rounded-[3rem] border-white flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-6xl">inactive_shortcut</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">No active protocols detected.</h3>
                <p className="text-on-surface-variant max-w-xs mx-auto mt-2">The system has not logged any application streams from your identity yet.</p>
              </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 gap-6">
              {applications.map((app) => (
                  <button 
                    key={app.id} 
                    onClick={() => handleViewDetails(app.id)}
                    className="w-full text-left glass-card p-5 sm:p-6 md:p-8 rounded-[2rem] border-white hover:border-primary/40 hover:bg-white transition-all group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-0 shadow-sm hover:shadow-xl shadow-primary/5 active:scale-[0.99]"
                  >
                      <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                              <History size={24} className="sm:w-[28px] sm:h-[28px]" />
                          </div>
                          <div>
                              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-on-surface font-headline group-hover:text-primary transition-colors">{app.applied_role}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1.5 opacity-60">
                                      <Calendar size={12} className="text-primary" />
                                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                                          Deployed: {new Date(app.received_at).toLocaleDateString()}
                                      </span>
                                  </div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                  <div className="flex items-center gap-1.5 opacity-60">
                                      <Hash size={12} className="text-primary" />
                                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                                          ID: {app.id.substring(0, 8)}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 md:gap-8">
                          <div className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${getStatusColor(app.status)}`}>
                              {app.status}
                          </div>
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:border-primary/20 transition-all">
                              <ArrowUpRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </div>
                      </div>
                  </button>
              ))}
          </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={loadingDetail ? "Syncing Logic..." : selectedApp?.applied_role}
        subtitle="Detailed Protocol Metadata & Artifacts"
        maxWidth="max-w-6xl"
      >
          {loadingDetail ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-6">
                   <div className="relative">
                        <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <History className="text-primary/20" size={24} />
                        </div>
                   </div>
                   <p className="text-xs font-black text-primary uppercase tracking-[0.3em] animate-pulse">Initializing Data Stream</p>
              </div>
          ) : selectedApp && (
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      
                      {/* Intelligence Column */}
                      <div className="lg:col-span-4 space-y-8">
                            {/* Status Banner */}
                            <div className={`p-6 rounded-[2rem] border-2 space-y-4 ${getStatusColor(selectedApp.status)}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                        {selectedApp.status === 'Selected' ? <CheckCircle2 className="text-emerald-500" size={18} /> : 
                                        selectedApp.status === 'Rejected' ? <XCircle className="text-rose-500" size={18} /> : 
                                        <Loader2 className="animate-spin text-amber-500" size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Protocol State</p>
                                        <p className="text-sm font-black tracking-tight">{selectedApp.status}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-black/5">
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Deployed On</p>
                                    <p className="text-xs font-bold">{new Date(selectedApp.received_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Strategic Context */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                                    Strategy Narrative
                                </h4>
                                <div className="glass-card p-6 rounded-[2rem] border-slate-100 bg-slate-50/50">
                                    <p className="text-xs font-medium leading-relaxed text-slate-700 whitespace-pre-wrap">
                                        {selectedApp.job_post?.description || "Job description metadata not available for this record."}
                                    </p>
                                </div>
                            </div>

                            {/* Artifact Selection */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                                    Digital Artifacts
                                </h4>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => setActivePreview('cv')}
                                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${activePreview === 'cv' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-white border-slate-100 text-slate-600 hover:border-primary/30'}`}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <FileText size={18} />
                                            <div>
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Primary Artifact</p>
                                                <p className="text-[11px] font-black">Resume / CV</p>
                                            </div>
                                        </div>
                                        <Eye size={14} className={activePreview === 'cv' ? 'opacity-100' : 'opacity-20'} />
                                    </button>

                                    {selectedApp.cover_letter_path && (
                                        <button 
                                            onClick={() => setActivePreview('cover_letter')}
                                            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${activePreview === 'cover_letter' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-white border-slate-100 text-slate-600 hover:border-primary/30'}`}
                                        >
                                            <div className="flex items-center gap-3 text-left">
                                                <FileText size={18} />
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Secondary Artifact</p>
                                                    <p className="text-[11px] font-black">Cover Letter</p>
                                                </div>
                                            </div>
                                            <Eye size={14} className={activePreview === 'cover_letter' ? 'opacity-100' : 'opacity-20'} />
                                        </button>
                                    )}
                                </div>
                            </div>
                      </div>

                      {/* Display Column (Previewer) */}
                       <div className="lg:col-span-8 space-y-6">
                            <div className="glass-card rounded-[2.5rem] border-white shadow-2xl overflow-hidden flex flex-col h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] bg-slate-900">
                                <div className="px-4 sm:px-8 py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center bg-black/20 backdrop-blur-md gap-4 sm:gap-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                            Artifact Preview: {activePreview === 'cv' ? (selectedApp.cv_original_filename || 'resume.pdf') : (selectedApp.cover_letter_original_filename || 'cover_letter.pdf')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleOpenInNewTab(activePreview)}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                                            title="View in dedicated tab"
                                        >
                                            <ExternalLink size={12} /> View in Tab
                                        </button>
                                        <button 
                                            onClick={() => handleDownload(activePreview)}
                                            className="px-4 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary/30 hover:scale-105 active:scale-95"
                                        >
                                            <Download size={12} /> Extract
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 p-6 relative">
                                    {(activePreview === 'cv' ? previewUrl : clPreviewUrl) ? (
                                        <iframe 
                                            key={`${selectedApp.id}-${activePreview}`}
                                            src={`${activePreview === 'cv' ? previewUrl : clPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                            className="w-full h-full rounded-2xl border border-white/10 shadow-inner bg-slate-800"
                                            title="Artifact Visualization"
                                        ></iframe>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10">
                                                <Loader2 className="animate-spin" size={32} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Decoding Artifact</p>
                                                <p className="text-[10px] text-white/20 font-bold uppercase mt-1 tracking-widest italic">Initializing stream pipeline...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                      </div>

                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};

export default MyApplications;
