import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const InternDashboard = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appRes, notifRes] = await Promise.all([
          api.get('/intern/applications'),
          api.get('/notifications')
        ]);
        setApplications(appRes.data);
        setNotifications(notifRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getStatusData = () => {
    const counts = { New: 0, Pending: 0, Selected: 0, Rejected: 0, 'Offer Declined': 0, Terminated: 0 };
    applications.forEach(app => {
      if (counts[app.status] !== undefined) counts[app.status]++;
    });
    return [
      { name: 'New', value: counts.New, color: '#613380' },
      { name: 'Pending', value: counts.Pending, color: '#94a3b8' },
      { name: 'Selected', value: counts.Selected, color: '#10b981' },
      { name: 'Rejected', value: counts.Rejected, color: '#ef4444' },
      { name: 'Declined', value: counts['Offer Declined'], color: '#f97316' },
      { name: 'Terminated', value: counts.Terminated, color: '#475569' },
    ].filter(d => d.value > 0);
  };

  const handleSelectApp = async (app) => {
    setSelectedApp(app);
    try {
      if (app.job_id) {
        const res = await api.get(`/job-posts/${app.job_id}`);
        setSelectedJobDetails(res.data);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  const handleReadNotif = async (notif) => {
    setSelectedNotif(notif);
    if (!notif.is_read) {
      try {
        await api.post(`/notifications/${notif.id}/read`);
        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  if (loading) return null;

  const chartData = getStatusData();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-on-surface font-headline mb-2">
            Welcome back, {user?.first_name || 'Innovator'}!
          </h1>
          <p className="text-on-surface-variant font-medium text-sm sm:text-base md:text-lg">Tracks your applications and manage your professional laboratory profile.</p>
        </div>
        
        <button 
          onClick={() => setIsNotifModalOpen(true)}
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${unreadCount > 0 ? 'bg-primary text-white shadow-lg shadow-primary/30 animate-bounce' : 'bg-white border border-slate-200 text-on-surface-variant'}`}
        >
          <span className="material-symbols-outlined text-2xl">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Status Card */}
        <div className="md:col-span-8 glass-card p-6 sm:p-8 rounded-3xl border-white hover:shadow-xl transition-all group flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-lg sm:text-xl font-black text-on-surface font-headline">Profile Integrity</h3>
                   <p className="text-sm text-on-surface-variant font-medium">Complete your details to increase your visibility to HR.</p>
                </div>
                <div className="w-12 h-12 rounded-2xl kinetic-gradient flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">person</span>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="w-full h-3 bg-slate-100 dark:bg-dark-surface-3 rounded-full overflow-hidden">
                    <div 
                        className="h-full kinetic-gradient transition-all duration-1000" 
                        style={{ width: user?.profile_complete ? '100%' : '40%' }}
                    ></div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Profile {user?.profile_complete ? '100%' : '40%'} Synced</span>
                    <button 
                        onClick={() => navigate('/intern/profile')}
                        className="text-xs font-black text-primary hover:underline uppercase tracking-widest"
                    >
                        Optimize Profile
                    </button>
                </div>
            </div>
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-4 glass-card p-6 sm:p-8 rounded-3xl border-white bg-primary/5 flex flex-col justify-center items-center text-center space-y-4 cursor-pointer hover:scale-105 transition-all" onClick={() => navigate('/intern/applications')}>
            <div className="text-5xl font-black text-primary font-headline tracking-tighter">{applications.length}</div>
            <div>
               <p className="text-sm font-black text-on-surface uppercase tracking-widest">Active Applications</p>
               <p className="text-xs text-on-surface-variant font-medium mt-1">
                 {applications.length > 0 ? "Protocols in evaluation." : "No active protocols."}
               </p>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); navigate('/intern/jobs'); }}
                className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
                Browse Streams
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Evaluation Activity */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-lg sm:text-xl font-black text-on-surface font-headline">Recent Evaluation Activity</h3>
          {applications.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {applications.slice(0, 4).map((app) => (
                <div 
                  key={app.id} 
                  onClick={() => handleSelectApp(app)}
                  className="glass-card p-5 rounded-3xl border-white hover:border-primary/20 hover:shadow-lg transition-all cursor-pointer group flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  </div>
                  <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-black text-on-surface truncate pr-2 text-sm">{app.applied_role}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          app.status === 'New' ? 'bg-primary' : 
                          app.status === 'Selected' ? 'bg-emerald-500' : 
                          app.status === 'Offer Declined' ? 'bg-orange-500' :
                          app.status === 'Terminated' ? 'bg-slate-600' :
                          'bg-slate-400'
                        }`}></span>
                        <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">{app.status}</p>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 rounded-[2.5rem] border-white flex flex-col items-center justify-center text-center space-y-4 grayscale opacity-40">
                <span className="material-symbols-outlined text-5xl">history</span>
                <p className="font-bold text-on-surface-variant text-sm">No system logs found for your account yet.</p>
            </div>
          )}
        </div>

        {/* Strategic Analysis Chart */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-lg sm:text-xl font-black text-on-surface font-headline">Strategic Protocol Analysis</h3>
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white min-h-[280px] flex items-center justify-center relative overflow-hidden">
            {chartData.length > 0 ? (
              <div className="w-full flex flex-col sm:flex-row items-center gap-6 sm:gap-0">
                <div className="w-full sm:w-1/2 h-[220px] sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-3 sm:pl-4">
                   {chartData.map((d, i) => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">{d.name}</span>
                        </div>
                        <span className="text-xs font-black text-on-surface">{d.value}</span>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 opacity-40">
                 <span className="material-symbols-outlined text-4xl">monitoring</span>
                 <p className="text-[11px] font-black uppercase tracking-widest">Awaiting active signals</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      <Modal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        title="Official Signals Engine"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto p-4 custom-scrollbar">
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleReadNotif(notif)}
                  className={`p-6 rounded-[2rem] border transition-all cursor-pointer flex gap-5 items-start ${notif.is_read ? 'bg-white border-slate-100 opacity-60' : 'bg-primary/5 border-primary/20 shadow-sm shadow-primary/5'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.is_read ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white shadow-lg'}`}>
                    <span className="material-symbols-outlined text-xl">
                      {notif.is_read ? 'drafts' : 'mail'}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className={`font-black uppercase tracking-widest text-[10px] ${notif.is_read ? 'text-on-surface-variant' : 'text-primary'}`}>
                        {notif.is_read ? 'Legacy Signal' : 'Active Transmission'}
                      </h5>
                      <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-on-surface">{notif.subject}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-1 font-medium italic pr-4">{notif.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <span className="material-symbols-outlined text-6xl">leak_remove</span>
              <p className="text-xs font-black uppercase tracking-[0.3em]">No signals detected in the hub.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Job Summary Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => { setSelectedApp(null); setSelectedJobDetails(null); }}
        title="Protocol Application Summary"
      >
        {selectedApp && (
          <div className="space-y-8 p-2 max-h-[80vh] overflow-y-auto no-scrollbar">
            {/* Header Media */}
            <div className="relative h-48 rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-200">
               {selectedJobDetails?.media_url ? (
                  (() => {
                    const mUrl = getMediaUrl(selectedJobDetails.media_url);
                    return mUrl.endsWith('.mp4') || mUrl.endsWith('.webm') ? (
                      <video src={mUrl} className="w-full h-full object-cover" autoPlay muted loop />
                    ) : (
                      <img 
                        src={mUrl} 
                        alt="Job Visual" 
                        loading="lazy"
                        onLoad={(e) => e.target.style.opacity = 1}
                        className="w-full h-full object-cover opacity-0 transition-opacity duration-500" 
                      />
                    );
                  })()
               ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <span className="material-symbols-outlined text-5xl text-slate-200">rocket_launch</span>
                  </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
               <div className="absolute bottom-6 left-8">
                  <p className="text-[10px] font-black p-1 px-3 bg-white/20 backdrop-blur-md text-white rounded-full uppercase tracking-widest inline-block mb-2">
                    {selectedJobDetails?.category || selectedApp.applied_role}
                  </p>
                  <h3 className="text-2xl font-black text-white font-headline">{selectedApp.applied_role}</h3>
               </div>
            </div>

            {/* Status Information */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Current Protocol Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedApp.status === 'New' ? 'bg-primary' : 
                      selectedApp.status === 'Selected' ? 'bg-emerald-500' : 
                      selectedApp.status === 'Offer Declined' ? 'bg-orange-500' :
                      selectedApp.status === 'Terminated' ? 'bg-slate-600' :
                      'bg-slate-400'
                    }`}></span>
                    <p className="text-sm font-black text-on-surface">{selectedApp.status}</p>
                  </div>
               </div>
               <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200">
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Mission Submission Date</p>
                  <p className="text-sm font-bold text-on-surface">{new Date(selectedApp.received_at).toLocaleDateString()}</p>
               </div>
            </div>

            {/* Job Details Section */}
            {selectedJobDetails ? (
              <div className="space-y-6">
                <div className="space-y-3">
                   <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">description</span>
                      Mission Description
                   </h4>
                   <p className="text-xs text-on-surface-variant leading-relaxed font-medium bg-slate-50/50 p-5 rounded-2xl border border-dotted border-slate-200">
                      {selectedJobDetails.description}
                   </p>
                </div>

                <div className="space-y-3">
                   <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">fact_check</span>
                      Core Requirements
                   </h4>
                   <p className="text-xs text-on-surface-variant leading-relaxed font-medium bg-slate-50/50 p-5 rounded-2xl border border-dotted border-slate-200">
                      {selectedJobDetails.requirements}
                   </p>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-3 opacity-40">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">Decoding mission parameters...</p>
              </div>
            )}

            <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">shield</span>
                  </div>
                  <p className="text-[10px] font-bold leading-relaxed">
                    This protocol is managed by the secure recruitment engine. You will be notified of any changes via your dashboard and registered email.
                  </p>
               </div>
            </div>

            <button 
                onClick={() => { setSelectedApp(null); setSelectedJobDetails(null); }}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
                Return to Command Center
            </button>
          </div>
        )}
      </Modal>

      {/* Signal Detail Modal */}
      <Modal
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        title="Protocol Signal Detail"
      >
        {selectedNotif && (
          <div className="space-y-8 p-4">
             <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                   <span className="material-symbols-outlined text-2xl">mark_email_unread</span>
                </div>
                <div>
                   <h4 className="text-lg font-black text-on-surface mb-0.5">{selectedNotif.subject}</h4>
                   <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Verification Date: {new Date(selectedNotif.created_at).toLocaleString()}</p>
                </div>
             </div>

             <div className="p-8 glass-card border-white bg-white/40 min-h-[200px]">
                <p className="text-on-surface font-medium leading-relaxed whitespace-pre-wrap">{selectedNotif.body}</p>
             </div>

             <div className="rounded-[2rem] bg-amber-50 border border-amber-200/50 p-6 flex items-start gap-4">
                <span className="material-symbols-outlined text-amber-600">info</span>
                <p className="text-[10px] text-amber-800 font-bold leading-relaxed uppercase tracking-wider opacity-80">
                  This signal was transmitted via the secure internal protocol. Please respond to HR via the registered email if required, or wait for further dashboard updates.
                </p>
             </div>

             <button 
                onClick={() => setSelectedNotif(null)}
                className="w-full py-5 hero-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
             >
                Acknowledge Transmission
             </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InternDashboard;
