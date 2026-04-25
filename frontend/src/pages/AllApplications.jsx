import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';

const AllApplications = ({ type = 'all' }) => {
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [appsToCompare, setAppsToCompare] = useState([]);
  const navigate = useNavigate();

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
      };

      // Add type-specific filters
      if (type === 'new') {
        params.status = 'New';
        params.is_spam = false;
        params.is_duplicate = false;
      } else if (type === 'duplicates') {
        params.is_duplicate = true;
        params.is_spam = false;
      } else if (type === 'spam') {
        params.is_spam = true;
      } else {
        // 'all' tab - exclude spam by default as per user request
        params.is_spam = false;
      }

      const res = await api.get('/applications/', { params });
      setApps(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/applications/roles');
      setRoles(res.data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [page, statusFilter, roleFilter, type]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApps();
  };

  const toggleSelectAll = () => {
    if (selected.length === apps.length) {
      setSelected([]);
    } else {
      setSelected(apps.map(a => a.id));
    }
  };

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const openCompareModal = (app) => {
    setAppsToCompare([
      { ...app, type: 'Current Submission' }
    ]);
    setIsCompareModalOpen(true);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">
            {type === 'all' ? 'Application Hub' : 
             type === 'new' ? 'New Protocols' :
             type === 'duplicates' ? 'Conflict Resolution' : 'Signal Filtering'}
          </h1>
          <p className="text-on-surface-variant font-medium text-lg">Managing the intern recruitment ecosystem with precision.</p>
        </div>
        <button 
          onClick={fetchApps}
          className="p-4 glass-card rounded-2xl text-on-surface-variant hover:text-primary hover:bg-white tonal-transition flex items-center gap-3 shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span className="text-xs font-black uppercase tracking-widest">Resync Hub</span>
        </button>
      </header>

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-wrap gap-6 items-center glass-card p-6 rounded-3xl border-white shadow-sm ring-1 ring-slate-200/20">
        <form onSubmit={handleSearch} className="flex-1 min-w-[350px] relative">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="Search stream by name or credential..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
          />
        </form>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center glass-card bg-white px-5 py-3 rounded-2xl border-slate-200">
            <span className="material-symbols-outlined text-sm text-slate-400 mr-3">filter_alt</span>
            <select 
              className="bg-transparent border-none p-0 text-xs font-black uppercase tracking-widest text-on-surface-variant focus:ring-0 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Global Status</option>
              <option value="New">Protocol: New</option>
              <option value="Pending">Protocol: Pending</option>
              <option value="Selected">Protocol: Selected</option>
              <option value="Rejected">Protocol: Rejected</option>
              <option value="Offer Declined">Protocol: Declined</option>
              <option value="Terminated">Protocol: Terminated</option>
            </select>
          </div>

          <div className="flex items-center glass-card bg-white px-5 py-3 rounded-2xl border-slate-200">
            <select 
              className="bg-transparent border-none p-0 text-xs font-black uppercase tracking-widest text-on-surface-variant focus:ring-0 cursor-pointer"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Stream Logic</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Stream Table */}
      <section className="glass-card rounded-[3rem] shadow-2xl shadow-primary/5 overflow-hidden border-white">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary/30"
                      checked={apps.length > 0 && selected.length === apps.length}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                {['Applicant / Stream', 'Credentials', 'Protocol Date', 'Status', 'Signal Flags', 'Action'].map((h, i) => (
                  <th key={h} className={`px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-body">
              {apps.map((app) => (
                <tr 
                  key={app.id} 
                  className={`hover:bg-white/60 transition-colors cursor-pointer group ${selected.includes(app.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <td className="px-10 py-8" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary/30"
                        checked={selected.includes(app.id)}
                        onChange={() => toggleSelect(app.id)}
                      />
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl kinetic-gradient flex items-center justify-center text-white shadow-lg group-hover:scale-110 tonal-transition">
                         <span className="text-xs font-black">{app.applicant_name ? app.applicant_name[0] : 'U'}</span>
                      </div>
                      <div>
                        <p className="text-base font-black text-on-surface group-hover:text-primary transition-colors">{app.applicant_name || 'Anonymous'}</p>
                        <p className="text-xs text-on-surface-variant font-bold opacity-60 tracking-widest uppercase">{app.applied_role || 'General Stream'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-sm text-on-surface-variant font-bold">{app.email}</td>
                  <td className="px-10 py-8 text-sm text-on-surface-variant font-bold">
                    {new Date(app.received_at).toLocaleDateString()}
                  </td>
                  <td className="px-10 py-8">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex gap-2">
                       {app.duplicate_flag && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); openCompareModal(app); }}
                           className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-[9px] font-black uppercase tracking-widest ring-1 ring-orange-200 transition-all hover:bg-orange-100"
                         >
                           <span className="material-symbols-outlined text-sm">content_copy</span>
                           Conflict
                         </button>
                       )}
                       {app.spam_flag && (
                         <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest ring-1 ring-primary/20">
                           <span className="material-symbols-outlined text-sm">report</span>
                           Signal
                         </div>
                       )}
                       {!app.duplicate_flag && !app.spam_flag && <span className="opacity-20">—</span>}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right font-black">
                     <span className="material-symbols-outlined text-slate-300 group-hover:text-primary tonal-transition">arrow_forward</span>
                  </td>
                </tr>
              ))}
              {apps.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center opacity-30">
                       <span className="material-symbols-outlined text-6xl mb-4">leak_remove</span>
                       <p className="text-xs font-black uppercase tracking-[0.2em]">No Synchronized Streams Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Stats / Pagination */}
        <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-200/50 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hub Monitoring: {total} Records Synchronized</span>
          <div className="flex items-center gap-6">
             <div className="flex gap-2">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)} 
                  className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary tonal-transition disabled:opacity-20"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button 
                  disabled={apps.length < 10} 
                  onClick={() => setPage(p => p + 1)} 
                  className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary tonal-transition disabled:opacity-20"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-primary">Protocol Cycle {page}</span>
          </div>
        </div>
      </section>

      {/* Compare Applications Modal - REDESIGNED */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Conflict Resolution Protocol"
        subtitle="Analyzing dual submission signals for strategic identity verification."
        maxWidth="max-w-5xl"
        footer={(
          <div className="flex gap-4 justify-end w-full">
            <button 
              onClick={() => setIsCompareModalOpen(false)}
              className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-on-surface-variant hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest tonal-transition shadow-sm"
            >
              Terminate Analysis
            </button>
            <button 
              onClick={() => setIsCompareModalOpen(false)}
              className="px-10 py-3 hero-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 tonal-transition hover:scale-105 active:scale-95 flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Authorize Merge
            </button>
          </div>
        )}
      >
        <div className="grid grid-cols-2 gap-10">
          {appsToCompare.map((app, idx) => (
            <div key={idx} className={`p-10 rounded-[2.5rem] border ${idx === 0 ? 'border-orange-200 bg-orange-50/10' : 'glass-card border-success/20 bg-success/5'} space-y-8`}>
              <div className="flex justify-between items-start">
                <h4 className="text-2xl font-black text-on-surface font-headline">{app.type}</h4>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${idx === 0 ? 'bg-orange-100 text-orange-700' : 'bg-success/10 text-success'}`}>
                   {app.status || (idx === 0 ? 'Duplicate' : 'Strategic')}
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Subject Identity</label>
                  <p className="text-on-surface font-black text-lg">{app.applicant_name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Credential Key</label>
                  <p className="text-on-surface font-bold text-sm truncate opacity-70">{app.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Target Stream</label>
                    <p className="text-on-surface font-black text-xs">{app.applied_role || 'General Position'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Cycle Received</label>
                    <p className="text-on-surface font-black text-xs">{idx === 0 ? new Date(app.received_at).toLocaleDateString() : app.received_at}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AllApplications;
