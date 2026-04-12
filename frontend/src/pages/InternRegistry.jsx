import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNotification } from '../context/NotificationContext';
import { Mail, GraduationCap, Link as LinkIcon, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const InternRegistry = () => {
  const { showNotification } = useNotification();
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // Deactivation Modal State
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchInterns = async () => {
    try {
      const res = await api.get('/admin/interns');
      setInterns(res.data);
    } catch (err) {
      console.error("Error fetching intern registry:", err);
      showNotification("Failed to connect to Intern Database.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  const openDeactivateModal = (intern) => {
    setSelectedIntern(intern);
    setIsDeactivateModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedIntern) return;
    setTogglingStatus(true);
    try {
      const res = await api.post(`/admin/interns/${selectedIntern.id}/deactivate`);
      showNotification(res.data.message || "Account status toggled successfully", "success");
      setIsDeactivateModalOpen(false);
      fetchInterns();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to modify account status", "error");
    } finally {
      setTogglingStatus(false);
      setSelectedIntern(null);
    }
  };

  const filteredInterns = interns.filter(intern => {
    if (filter === 'active') return intern.is_active && intern.profile_complete;
    if (filter === 'inactive') return !intern.is_active && intern.profile_complete;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
             <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Intern Registry</h1>
             <p className="text-on-surface-variant font-medium text-lg">Master directory of all registered candidate accounts.</p>
          </div>
          
          <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-200 shadow-sm glass-card">
             {['all', 'active', 'inactive'].map(f => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                   filter === f 
                   ? 'bg-slate-900 text-white shadow-lg' 
                   : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                 }`}
               >
                 {f}
               </button>
             ))}
          </div>
        </header>

        {filteredInterns.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 bg-white/40 rounded-[3rem] border border-slate-200/50 glass-card">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">group_off</span>
              <h3 className="text-xl font-black text-slate-800">No Records Found</h3>
              <p className="text-sm font-bold text-slate-500 mt-2">No interns match the current query criteria.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredInterns.map((intern) => (
              <div key={intern.id} className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative group">
                
                {/* Status Banner */}
                <div className={`h-2 w-full ${!intern.is_active ? 'bg-danger' : intern.profile_complete ? 'bg-success' : 'bg-primary'}`}></div>

                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center gap-4">
                        {intern.profile_picture_url ? (
                          <img 
                            src={intern.profile_picture_url} 
                            alt="Profile" 
                            loading="lazy"
                            onLoad={(e) => e.target.style.opacity = 1}
                            className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white opacity-0 transition-opacity duration-500" 
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl uppercase border-2 border-white shadow-md">
                             {intern.first_name[0]}{intern.last_name[0]}
                          </div>
                        )}
                        <div>
                           <h3 className="text-xl font-black text-slate-900 leading-tight">{intern.first_name} {intern.last_name}</h3>
                           <div className="flex items-center gap-2 mt-1">
                              {intern.oauth_provider === 'google' && (
                                 <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-50 text-rose-500" title="Google OAuth">
                                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3 h-3"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                                 </span>
                              )}
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Auth Verified</span>
                           </div>
                        </div>
                     </div>
                     
                     {!intern.is_active ? (
                       <span className="px-3 py-1 bg-danger/10 text-danger rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-danger/20">
                         <XCircle size={12} /> Banned
                       </span>
                     ) : intern.profile_complete ? (
                       <span className="px-3 py-1 bg-success/10 text-success rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-success/20">
                         <CheckCircle size={12} /> Active
                       </span>
                     ) : (
                       <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-amber-200">
                          Incomplete
                       </span>
                     )}
                  </div>

                  <div className="space-y-4 pt-2">
                     <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <Mail size={16} className="text-slate-400" />
                        <span className="truncate">{intern.email}</span>
                     </div>
                     
                     {intern.university && (
                       <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                          <GraduationCap size={16} className="text-slate-400" />
                          <span className="truncate">{intern.university} <span className="opacity-50">({intern.graduation_year})</span></span>
                       </div>
                     )}
                     
                     {(intern.linkedin_url || intern.github_url || intern.portfolio_url) && (
                       <div className="flex items-center gap-3 text-sm font-medium text-slate-600 pt-2 border-t border-slate-100">
                          <LinkIcon size={16} className="text-slate-400" />
                          <div className="flex gap-3">
                             {intern.linkedin_url && <a href={intern.linkedin_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold text-xs">LinkedIn</a>}
                             {intern.github_url && <a href={intern.github_url} target="_blank" rel="noreferrer" className="text-slate-700 hover:underline font-bold text-xs">GitHub</a>}
                             {intern.portfolio_url && <a href={intern.portfolio_url} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-bold text-xs">Portfolio</a>}
                          </div>
                       </div>
                     )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-slate-100 transition-colors">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">
                     Joined: {new Date(intern.created_at).toLocaleDateString()}
                   </p>
                   <button
                     onClick={() => openDeactivateModal(intern)}
                     disabled={togglingStatus}
                     className={`p-2.5 rounded-xl transition-all shadow-sm ${
                       intern.is_active 
                       ? 'bg-white text-danger border border-slate-200 hover:bg-danger/10 hover:border-danger/30' 
                       : 'bg-white text-success border border-slate-200 hover:bg-success/10 hover:border-success/30'
                     }`}
                     title={intern.is_active ? "Ban User" : "Unban User"}
                   >
                     {intern.is_active ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Modal - Moved outside to ensure full page blur coverage */}
      {selectedIntern && (
        <ConfirmationModal
          isOpen={isDeactivateModalOpen}
          onClose={() => setIsDeactivateModalOpen(false)}
          onConfirm={handleToggleStatus}
          title={selectedIntern.is_active ? "Enforce Account Ban" : "Revoke Account Ban"}
          message={selectedIntern.is_active 
            ? `WARNING: You are about to permanently ban ${selectedIntern.first_name} ${selectedIntern.last_name}. They will be immediately blocked from accessing the intern portal and submitting new applications.` 
            : `Are you sure you want to restore access for ${selectedIntern.first_name} ${selectedIntern.last_name}?`}
          confirmText={selectedIntern.is_active ? "Enforce Ban" : "Restore Access"}
          expectedName={selectedIntern.is_active ? selectedIntern.email : null}
          itemName="Intern Email to verify ban"
        />
      )}
    </>
  );
};

export default InternRegistry;
