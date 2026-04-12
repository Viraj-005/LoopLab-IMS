import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected': return 'bg-success/10 text-success border-success/20';
      case 'Rejected': return 'bg-danger/10 text-danger border-danger/20';
      case 'Pending': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Protocol History</h1>
        <p className="text-on-surface-variant font-medium text-lg">Tracks your active recruitment streams and status logs.</p>
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
                  <div key={app.id} className="glass-card p-8 rounded-[2rem] border-white hover:border-primary/30 transition-all group flex items-center justify-between">
                      <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined">description</span>
                          </div>
                          <div>
                              <h3 className="text-xl font-black text-on-surface font-headline">{app.applied_role}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                                      Deployed: {new Date(app.received_at).toLocaleDateString()}
                                  </span>
                                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                                      ID: {app.id.substring(0, 8)}
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-8">
                          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(app.status)}`}>
                              {app.status}
                          </div>
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                              chevron_right
                          </span>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default MyApplications;
