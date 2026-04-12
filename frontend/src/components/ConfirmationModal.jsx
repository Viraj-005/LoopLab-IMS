import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Delete",
    expectedName = null, // If set, user must type this to confirm
    itemName = ""
}) => {
    const [inputValue, setInputValue] = useState("");
    const [isMatch, setIsMatch] = useState(!expectedName);

    useEffect(() => {
        if (expectedName) {
            setIsMatch(inputValue.trim().toLowerCase() === expectedName.trim().toLowerCase());
        }
    }, [inputValue, expectedName]);

    useEffect(() => {
        if (!isOpen) {
            setInputValue("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
            
            <div className="relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 overflow-hidden">
                <div className="p-10 space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center text-danger mx-auto">
                        <AlertTriangle size={32} />
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-on-surface font-headline uppercase tracking-tight">{title}</h3>
                        <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {expectedName && (
                        <div className="space-y-4 pt-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                Type <span className="text-danger select-none px-2 py-0.5 bg-danger/5 rounded font-black">{expectedName}</span> to confirm
                            </p>
                            <input
                                autoFocus
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-center text-sm font-bold focus:ring-2 ring-danger/20 focus:border-danger outline-none transition-all placeholder-slate-300"
                                placeholder={`Verify ${itemName}`}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            disabled={expectedName && !isMatch}
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all ${
                                (expectedName && !isMatch) 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale' 
                                : 'bg-danger text-white shadow-danger/20 hover:scale-[1.02] active:scale-95'
                            }`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-on-surface-variant hover:bg-slate-50 transition-all"
                        >
                            Abort
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
