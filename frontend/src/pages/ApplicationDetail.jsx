import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';

const ApplicationDetail = () => {
  const { showNotification } = useNotification();
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSignalModalOpen, setIsSignalModalOpen] = useState(false);
  const [signalSubject, setSignalSubject] = useState('');
  const [signalBody, setSignalBody] = useState('');
  const [sendingSignal, setSendingSignal] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchApp = async () => {
    try {
      const res = await api.get(`/applications/${id}`);
      setApp(res.data);
    } catch (err) {
      console.error("Error fetching application:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const updateStatus = async (status) => {
    if (status === 'Rejected') {
      setIsRejectModalOpen(true);
      return;
    }
    await performStatusUpdate(status);
  };

  const performStatusUpdate = async (status) => {
    try {
      await api.patch(`/applications/${id}`, { status });
      setIsRejectModalOpen(false);
      fetchApp();
      showNotification(`Protocol status updated to ${status}.`, "success");
    } catch (err) {
      showNotification("Failed to update protocol status.", "error");
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post(`/applications/${id}/notes`, { note });
      showNotification("Internal note committed to log.", "success");
      setNote('');
      fetchApp();
    } catch (err) {
      showNotification("Failed to commit entry.", "error");
    }
  };

  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      if (app?.id) {
        try {
          const response = await api.get(`/applications/${app.id}/cv`, {
            responseType: 'blob'
          });
          // Ensure the blob is treated as a PDF for the viewer
          const file = new Blob([response.data], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(file);
          setPreviewUrl(fileURL);
        } catch (error) {
          console.error("Failed to fetch preview artifact:", error);
        }
      }
    };
    fetchPreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [app?.id]);

  const handleDownloadCV = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await api.get(`/applications/${app.id}/cv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', app.cv_original_filename || 'cv.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Failed to download CV:", error);
      showNotification("Failed to extract document artifact.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handlePreviewCV = async () => {
    if (previewUrl) {
      window.open(previewUrl);
    } else {
      try {
        const response = await api.get(`/applications/${app.id}/cv`, {
          responseType: 'blob'
        });
        const file = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL);
      } catch (error) {
        console.error("Failed to preview CV:", error);
        showNotification("Failed to initialize document preview.", "error");
      }
    }
  };

  const handleSendSignal = async () => {
    if (!signalSubject.trim() || !signalBody.trim()) {
      showNotification("Subject and body are essential protocol artifacts.", "error");
      return;
    }
    setSendingSignal(true);
    try {
      await api.post(`/applications/${id}/send-email`, { 
        subject: signalSubject, 
        body: signalBody 
      });
      showNotification("Official signal transmitted through secure channels.", "success");
      setIsSignalModalOpen(false);
      setSignalSubject('');
      setSignalBody('');
      fetchApp();
    } catch (err) {
      showNotification("Signal transmission failure.", "error");
    } finally {
      setSendingSignal(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
  if (!app) return <div className="p-8 text-on-surface">Application not found</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1500px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between pb-8 border-b border-slate-200/50">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white tonal-transition"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-on-surface font-headline mb-1">{app.applicant_name}</h1>
            <p className="text-on-surface-variant font-bold text-sm tracking-widest uppercase opacity-60">
              Protocol: {app.applied_role || 'General Stream'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSignalModalOpen(true)}
            className="flex items-center gap-3 px-8 py-3.5 glass-card rounded-2xl text-on-surface-variant hover:text-primary hover:bg-white text-xs font-black uppercase tracking-widest transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">mail</span>
            Signal Applicant
          </button>
          <button 
            onClick={() => performStatusUpdate(app.status)}
            className="flex items-center gap-3 px-10 py-3.5 hero-gradient text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95"
          >
             {success ? (
               <span className="material-symbols-outlined text-sm">check_circle</span>
             ) : (
               <span className="material-symbols-outlined text-sm">save_as</span>
             )}
            <span>Commit Changes</span>
          </button>
        </div>
      </header>

      {/* Logic Flags */}
      {(app.spam_flag || app.duplicate_flag) && (
        <div className={`p-6 rounded-[2rem] flex items-center gap-4 border-white shadow-lg animate-in fade-in zoom-in duration-700 ${app.spam_flag ? 'bg-primary/5 text-primary ring-1 ring-primary/20' : 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'}`}>
          <span className="material-symbols-outlined text-2xl animate-pulse">
            {app.spam_flag ? 'report' : 'content_copy'}
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Automated Signal Analysis</p>
            <p className="text-sm font-black">
              {app.spam_flag ? `Spam Protocol Triggered: ${app.spam_reason}` : `Duplicate Identity Mapped: ${app.duplicate_reason}`}
            </p>
          </div>
          <button className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 tonal-transition">Suppress Flag</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* CV Preview Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-[2.5rem] border-white shadow-2xl shadow-primary/5 overflow-hidden flex flex-col h-[850px]">
            <div className="px-10 py-8 border-b border-slate-200/30 flex justify-between items-center bg-white/20">
              <div className="flex items-center gap-4">
                 <span className="material-symbols-outlined text-primary">description</span>
                 <h3 className="font-black text-on-surface font-headline">Submission Artifact</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownloadCV}
                  disabled={downloading}
                  className="flex items-center gap-3 px-6 py-2.5 glass-card bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">{downloading ? 'sync' : 'download'}</span>
                  {downloading ? 'Processing...' : 'Extract'}
                </button>
              </div>
            </div>
             <div className="flex-1 bg-slate-100/50 flex flex-col p-8 overflow-hidden relative group">
                {previewUrl ? (
                  <>
                    <iframe 
                      key={app.id}
                      src={`${previewUrl}#toolbar=0`} 
                      className="w-full h-full rounded-2xl border border-slate-200 shadow-2xl bg-white"
                      title="CV Preview"
                    ></iframe>
                    {/* Centered Overlay Button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all">
                       <button 
                         onClick={handlePreviewCV}
                         className="pointer-events-auto px-10 py-5 bg-white/95 backdrop-blur-lg border border-slate-200 rounded-[2rem] flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:scale-105 active:scale-95 transition-all"
                       >
                         <span className="material-symbols-outlined text-black font-black text-2xl">open_in_new</span>
                         <span className="text-black font-black text-sm uppercase tracking-[0.2em]">Preview</span>
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-6 shadow-transparent hover:shadow-[0_0_50px_rgba(97,51,128,0.05)] tonal-transition">
                      {/* Loading/Pending State */}
                      <div className="flex flex-col items-center gap-6 animate-pulse">
                        <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary/30">
                          <span className="material-symbols-outlined text-5xl">picture_as_pdf</span>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-sm font-black text-on-surface font-headline uppercase tracking-widest">Protocol Search Active</p>
                          <p className="text-xs text-on-surface-variant font-bold opacity-40 font-mono">Initializing artifact stream...</p>
                        </div>
                      </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Intelligence Side Panel */}
        <div className="lg:col-span-5 space-y-10">
          {/* Identity Meta Card */}
          <div className="glass-card p-10 rounded-[3rem] border-white shadow-xl shadow-primary/5 space-y-10">
            <div>
              <h3 className="text-2xl font-black text-on-surface font-headline mb-8">Subject Metadata</h3>
              <div className="grid grid-cols-2 gap-y-10 gap-x-8">
                {[
                  { label: 'Signal ID', value: app.applicant_name, icon: 'person' },
                  { label: 'Coordinate', value: app.email, icon: 'alternate_email' },
                  { label: 'Target Logic', value: app.applied_role || 'Unspecified', icon: 'settings_input_component' },
                  { label: 'Cycle Received', value: new Date(app.received_at).toLocaleDateString(), icon: 'event' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2 group cursor-default">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="material-symbols-outlined text-sm text-primary opacity-40">{item.icon}</span>
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 tonal-transition">{item.label}</p>
                    </div>
                    <p className="text-sm font-black text-on-surface truncate group-hover:text-primary transition-colors">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Protocol Status</h3>
              <div className="relative">
                <select 
                  value={app.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="w-full px-6 py-4 bg-white/60 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer appearance-none"
                >
                  <option value="New">Status: New Entry</option>
                  <option value="Pending">Status: Evaluation</option>
                  <option value="Selected">Status: Authorized</option>
                  <option value="Rejected">Status: Terminated</option>
                </select>
                <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">expand_more</span>
              </div>
            </div>
          </div>

          {/* Internal Protocol Log (Notes) */}
          <div className="glass-panel p-1 rounded-[3rem] bg-gradient-to-br from-white/80 to-white/20">
            <div className="bg-white/40 p-10 rounded-[3rem] min-h-[500px] flex flex-col">
              <h3 className="text-2xl font-black text-on-surface font-headline mb-8 flex items-center justify-between">
                <span>Protocol Log</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest px-3 py-1 bg-primary/5 rounded-full ring-1 ring-primary/10">Internal Only</span>
              </h3>
              <div className="flex-1 space-y-6 mb-8 overflow-y-auto no-scrollbar">
                 {(!app.timeline || app.timeline.filter(t => t.action_type === 'note_added').length === 0) && (
                   <div className="py-20 flex flex-col items-center opacity-20">
                      <span className="material-symbols-outlined text-4xl mb-4">edit_note</span>
                      <p className="text-xs font-black uppercase tracking-widest">No entries logged</p>
                   </div>
                 )}
                 {app.timeline?.filter(t => t.action_type === 'note_added').map((n, i) => (
                   <div key={i} className="p-5 glass-card bg-white rounded-2xl border-white shadow-sm hover:translate-x-1 tonal-transition group">
                     <p className="text-sm font-medium text-on-surface leading-relaxed">{n.description}</p>
                     <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] font-black uppercase tracking-widest">{n.performed_by || 'SYSTEM'}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest">{new Date(n.created_at).toLocaleDateString()}</p>
                     </div>
                   </div>
                 ))}
              </div>
              
              <div className="space-y-4 pt-6 border-t border-slate-200/50">
                <textarea 
                  className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[150px] shadow-inner"
                  placeholder="Record strategic internal note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button 
                  onClick={addNote}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add_comment</span>
                  Commit Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      {/* Signal Modal */}
      <Modal
        isOpen={isSignalModalOpen}
        onClose={() => setIsSignalModalOpen(false)}
        title={app?.source === 'PORTAL' ? 'Official Internal Signal' : 'External Email Transmission'}
      >
        <div className="space-y-6 p-4">
          <div className={`p-4 rounded-2xl flex items-center gap-4 ${app?.source === 'PORTAL' ? 'bg-primary/5 text-primary' : 'bg-slate-100 text-slate-600'}`}>
            <span className="material-symbols-outlined">
              {app?.source === 'PORTAL' ? 'notifications_active' : 'alternate_email'}
            </span>
            <div className="text-xs font-black uppercase tracking-wider">
              {app?.source === 'PORTAL' ? 'Direct Dashboard Communication Protocol' : 'SMTP Relay Transmission Protocol'}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-2 block">Subject Header</label>
              <input 
                type="text"
                value={signalSubject}
                onChange={(e) => setSignalSubject(e.target.value)}
                placeholder="Enter signal subject..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-2 block">Message Payload</label>
              <textarea 
                rows="6"
                value={signalBody}
                onChange={(e) => setSignalBody(e.target.value)}
                placeholder="Compose the details of your official signal..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              ></textarea>
            </div>
          </div>

          {app?.source === 'PORTAL' && (
            <p className="text-[9px] text-on-surface-variant font-medium italic opacity-60 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
              Note: This signal will be transmitted directly to the intern's secure dashboard. A backup notification alert will also be dispatched to their registered email address.
            </p>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setIsSignalModalOpen(false)}
              className="flex-1 py-4 glass-card border-slate-200 text-on-surface-variant font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Abort Signal
            </button>
            <button 
              onClick={handleSendSignal}
              disabled={sendingSignal}
              className="flex-1 py-4 hero-gradient text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendingSignal ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Transmitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">send</span>
                  Initiate Transmission
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={() => performStatusUpdate('Rejected')}
        title="Terminate Applicant Stream"
        message={`WARNING: You are about to permanently terminate the recruitment evaluation for ${app.applicant_name}. This action is irreversible.`}
        confirmText="Confirm Termination"
        expectedName={app.applicant_name}
        itemName="Applicant Name"
      />
    </div>
  );
};

export default ApplicationDetail;
