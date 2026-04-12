import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    'New': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Selected': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
