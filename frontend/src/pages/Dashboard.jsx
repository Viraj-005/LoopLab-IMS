import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullLog, setShowFullLog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [intervalDays, setIntervalDays] = useState(7); // Default to 7 days as requested
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showControls, setShowControls] = useState(false);

  // Helper to ensure naive UTC strings from backend are parsed as UTC
  const formatStreamTime = (dateStr, full = false) => {
    if (!dateStr) return '';
    // Append Z if no timezone indicator exists to force UTC parsing
    const standardized = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`;
    const date = new Date(standardized);
    
    if (full) {
      return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statsIntervals = [
    { label: 'Last 30 Days', value: 30 },
    { label: 'Last 90 Days', value: 90 },
    { label: 'Last 365 Days', value: 365 },
  ];

  const [categories, setCategories] = useState(["All"]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/dashboard/categories');
        if (res.data) setCategories(res.data);
      } catch (e) {
        console.error("Failed to fetch analytics categories:", e);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const days = intervalDays;
      const [statsRes, activityRes, chartRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activity'),
        api.get(`/dashboard/chart?days=${days}&category=${selectedCategory}`)
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
      setChartData(chartRes.data && chartRes.data.length > 0 ? chartRes.data : []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [intervalDays, selectedCategory]);

  const exportToCSV = () => {
    const headers = "Date,Application Count\n";
    const rows = chartData.map(d => `${d.date},${d.count}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Application_Velocity_${selectedCategory.replace(/\s+/g, '_')}_${intervalDays}d.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowControls(false);
  };

  if (loading && !stats) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  const statCards = [
    { title: 'Applications', value: stats?.total_applications, icon: 'description', trend: '+12%', colorClass: 'text-primary' },
    { title: 'Pending', value: stats?.pending_review, icon: 'history', trend: null, colorClass: 'text-amber-600' },
    { title: 'Selected', value: stats?.selected, icon: 'verified', trend: '+8%', colorClass: 'text-success' },
    { title: 'Rejected', value: stats?.rejected, icon: 'cancel', trend: null, colorClass: 'text-danger' },
    { title: 'Declined', value: stats?.declined, icon: 'block', trend: null, colorClass: 'text-orange-600' },
    { title: 'Terminated', value: stats?.terminated, icon: 'person_off', trend: null, colorClass: 'text-slate-600' },
    { title: 'Duplicates', value: stats?.possible_duplicates, icon: 'content_copy', trend: null, colorClass: 'text-orange-500' },
    { title: 'Spam Signals', value: stats?.suspected_spam, icon: 'report_gmailerrorred', trend: null, colorClass: 'text-primary-container' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">IMS Intelligence</h1>
          <p className="text-on-surface-variant font-medium text-lg">System status: <span className="text-primary font-black underline decoration-2 underline-offset-4">Optimal Efficiency</span>. Overseeing all intern cycles.</p>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-3">
           <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <button className="relative px-8 py-3 bg-white rounded-xl leading-none flex items-center divide-x divide-gray-200 shadow-xl overflow-hidden glass-card cursor-default">
                 <span className="flex items-center space-x-3 pr-6">
                   <span className="material-symbols-outlined text-primary">analytics</span>
                   <span className="text-on-surface font-black text-xs uppercase tracking-widest font-headline">Protocol Alpha</span>
                 </span>
                 <span className="pl-6 text-primary font-black text-xs uppercase tracking-widest font-headline">Active</span>
              </button>
           </div>
           
           <div className="text-right mr-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mt-1">
                 {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 
                 <span className="text-slate-300 ml-1">LOCAL</span>
              </p>
           </div>
        </div>
      </header>

      {/* Numerical Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
        {statCards.map((card, i) => (
          <div key={i} className="glass-card ambient-shadow p-6 rounded-3xl border-white transition-transform hover:scale-[1.03] cursor-default flex flex-col justify-between h-44">
             <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl bg-primary/5 ${card.colorClass}`}>
                  <span className="material-symbols-outlined text-2xl">{card.icon}</span>
                </div>
                {card.trend && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-1 bg-primary/5 rounded-full ring-1 ring-primary/20">{card.trend}</span>
                )}
             </div>
             <div>
                <p className="text-3xl font-black text-on-surface font-headline mb-0">{card.value || 0}</p>
                <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-40">{card.title}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Analytics Section */}
        <div className="xl:col-span-2 glass-card p-10 rounded-[3rem] border-white ring-1 ring-slate-200/30 overflow-visible relative">
          <div className="flex justify-between items-center mb-10">
             <div>
                <h3 className="text-2xl font-black text-on-surface font-headline">Application Velocity</h3>
                <p className="text-xs font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">
                  Temporal Analysis - {selectedCategory} Segment
                </p>
             </div>
             <div className="relative">
                <button 
                   onClick={() => setShowControls(!showControls)}
                   className={`p-3 rounded-2xl transition-all duration-300 ${showControls ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
                >
                   <span className="material-symbols-outlined">filter_list</span>
                </button>

                {showControls && (
                   <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowControls(false)}></div>
                      <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-3xl border border-white p-6 shadow-2xl z-20 animate-in zoom-in-95 duration-200 origin-top-right">
                         <div className="space-y-6">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Time Interval</p>
                               <div className="grid grid-cols-2 gap-2">
                                  {statsIntervals.map((itv) => (
                                     <button 
                                        key={itv.value}
                                        onClick={() => { setIntervalDays(itv.value); setShowControls(false); }}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${intervalDays === itv.value ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                     >
                                        {itv.label}
                                     </button>
                                  ))}
                               </div>
                            </div>

                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Segment Data</p>
                               <select 
                                  value={selectedCategory}
                                  onChange={(e) => { setSelectedCategory(e.target.value); setShowControls(false); }}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                               >
                                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                               </select>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                               <button 
                                 onClick={exportToCSV}
                                 className="w-full py-3 hero-gradient text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                               >
                                  <span className="material-symbols-outlined text-sm">download</span>
                                  Export Report (CSV)
                               </button>
                            </div>
                         </div>
                      </div>
                   </>
                )}
             </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#613380" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#613380" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#613380" strokeOpacity={0.05} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false} 
                  tick={{fill: '#4c444f', fontSize: 10, fontWeight: 700}}
                  dy={15}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#4c444f', fontSize: 10, fontWeight: 700}} 
                  dx={-15}
                />
                <Tooltip 
                  contentStyle={{backgroundColor: '#613380', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(97, 51, 128, 0.2)'}}
                  itemStyle={{color: '#ffffff', fontWeight: 900, fontSize: '12px'}}
                  labelStyle={{color: '#efcfff', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#613380" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Signal Stream (Recent Activity) */}
        <div className="glass-panel p-1 rounded-[3rem] bg-gradient-to-br from-white/80 to-white/20">
          <div className="bg-white/40 p-10 rounded-[3rem] h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-on-surface font-headline">Signal Stream</h3>
              <span className="w-3 h-3 bg-success rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
            </div>
            
            <div className="space-y-8 flex-1 overflow-y-hidden pr-2">
              {activity.slice(0, 4).map((item, i) => (
                <div key={item.id} className="relative pl-10 group cursor-default">
                  {/* Vertical line indicator */}
                  <div className="absolute left-[11px] top-8 bottom-[-20px] w-0.5 bg-primary/10 group-last:hidden"></div>
                  
                  <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center z-10 group-hover:border-primary tonal-transition shadow-sm">
                     <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary tonal-transition"></span>
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors mb-1 leading-relaxed">
                      <span className="font-black opacity-40 uppercase tracking-widest mr-2">{item.performed_by || 'SYSTEM'}</span> 
                      {item.description}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {formatStreamTime(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                    <span className="material-symbols-outlined text-5xl mb-4">leak_remove</span>
                    <p className="text-xs font-black uppercase tracking-widest">No Signals Detected</p>
                 </div>
              )}
            </div>
            {activity.length > 4 && (
              <button 
                onClick={() => setShowFullLog(true)}
                className="mt-8 w-full py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest tonal-transition hover:bg-slate-50 hover:shadow-lg"
              >
                 Full Protocol Log
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showFullLog}
        onClose={() => setShowFullLog(false)}
        title="Full Protocol Log"
        size="lg"
      >
        <div className="space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar pr-2 py-4">
           {activity.map((item, i) => (
             <div key={item.id} className="relative pl-10 group cursor-default">
                 {/* Vertical line indicator */}
                 <div className="absolute left-[11px] top-8 bottom-[-20px] w-0.5 bg-primary/10 group-last:hidden"></div>
                 
                 <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center z-10 group-hover:border-primary transition-colors shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></span>
                 </div>
                 
                 <div>
                   <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-primary transition-colors mb-1 leading-relaxed">
                     <span className="font-black text-slate-400 opacity-80 uppercase tracking-widest mr-2">{item.performed_by || 'SYSTEM'}</span> 
                     {item.description}
                   </p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     {formatStreamTime(item.created_at, true)}
                   </p>
                 </div>
             </div>
           ))}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
