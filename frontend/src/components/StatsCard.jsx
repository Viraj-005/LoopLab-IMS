import React from 'react';
import { useNavigate } from 'react-router-dom';

const StatsCard = ({ title, value, icon: Icon, trend, colorClass = "bg-primary-100 text-primary-600" }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // Map card title to status filter
    if (title === 'Total Applications') navigate('/applications');
    else if (title === 'Pending Review') navigate('/applications?status=Pending');
    else if (title === 'Selected') navigate('/applications?status=Selected');
    else if (title === 'Rejected') navigate('/applications?status=Rejected');
    else if (title === 'Possible Duplicates') navigate('/applications/duplicates');
    else if (title === 'Suspected Spam') navigate('/applications/spam');
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:border-blue-500/50 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 group-hover:text-primary-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-wider text-[10px]">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.startsWith('+') ? 'text-success' : 'text-danger'}`}>
              {trend} <span className="text-slate-400 font-normal">from last week</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg transition-transform group-hover:scale-110 ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
