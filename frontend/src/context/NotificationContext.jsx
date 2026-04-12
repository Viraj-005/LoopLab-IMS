import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'success', duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
    }, []);

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-success" size={20} />;
            case 'error': return <XCircle className="text-danger" size={20} />;
            default: return <AlertCircle className="text-primary" size={20} />;
        }
    };

    const getStyle = (type) => {
        switch (type) {
            case 'success': return 'border-success/20 bg-white/90 shadow-success/10';
            case 'error': return 'border-danger/20 bg-white/90 shadow-danger/10';
            default: return 'border-primary/20 bg-white/90 shadow-primary/10';
        }
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {/* Notification Portal */}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl border glass-effect shadow-2xl animate-in slide-in-from-right-8 duration-300 ${getStyle(n.type)}`}
                        style={{ minWidth: '320px' }}
                    >
                        <div className="flex-shrink-0">
                            {getIcon(n.type)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-on-surface tracking-tight uppercase">{n.type}</p>
                            <p className="text-xs font-bold text-on-surface-variant opacity-80">{n.message}</p>
                        </div>
                        <button 
                            onClick={() => removeNotification(n.id)}
                            className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
