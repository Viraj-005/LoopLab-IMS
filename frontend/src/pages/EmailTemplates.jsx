import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';

const EmailTemplates = () => {
  const { showNotification } = useNotification();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    subject: '',
    body: '',
    tone: 'formal',
    auto_send_enabled: false,
    template_type: 'custom'
  });

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/email-templates/');
      setTemplates(res.data);
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setCurrentTemplate(null);
    setEditFormData({
      name: '',
      subject: '',
      body: '',
      tone: 'formal',
      auto_send_enabled: false,
      template_type: 'custom'
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (template) => {
    setCurrentTemplate(template);
    setEditFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      tone: template.tone || 'formal',
      auto_send_enabled: template.auto_send_enabled,
      template_type: template.template_type
    });
    setIsEditModalOpen(true);
  };

  const openPreviewModal = (template) => {
    setCurrentTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (currentTemplate) {
        await api.put(`/email-templates/${currentTemplate.id}`, editFormData);
        showNotification(`Protocol ${editFormData.name} updated successfully.`, "success");
      } else {
        await api.post('/email-templates/', editFormData);
        showNotification(`Protocol ${editFormData.name} initialized successfully.`, "success");
      }
      setIsEditModalOpen(false);
      fetchTemplates();
    } catch (err) {
      showNotification("Failed to synchronize template logic.", "error");
    }
  };

  const openDeleteModal = (template) => {
    setCurrentTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentTemplate) return;
    try {
      await api.delete(`/email-templates/${currentTemplate.id}`);
      showNotification(`Protocol ${currentTemplate.name} decommissioned.`, "success");
      setIsDeleteModalOpen(false);
      fetchTemplates();
    } catch (err) { 
      showNotification("Authorization failure: Unable to decommission protocol.", "error"); 
    }
  };

  const toggleAutoSend = async (template) => {
    try {
      await api.put(`/email-templates/${template.id}`, {
        ...template,
        auto_send_enabled: !template.auto_send_enabled
      });
      showNotification(`Auto-dispatch ${!template.auto_send_enabled ? 'authorized' : 'restricted'} for ${template.name}.`, "success");
      fetchTemplates();
    } catch (err) {
      showNotification("Logic update failed.", "error");
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1500px] mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Signal Templates</h1>
          <p className="text-on-surface-variant font-medium text-lg">Automated communication protocols for the intern lifecycle.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="hero-gradient text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 tonal-transition flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Initialize Template
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {templates.map((template) => (
          <div key={template.id} className="glass-card rounded-[2.5rem] border-white shadow-xl shadow-primary/5 overflow-hidden flex flex-col group hover:scale-[1.02] tonal-transition cursor-default">
            <div className="p-10 flex-1 space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-5 translate-y-[-4px]">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                    template.template_type === 'application_received' ? 'kinetic-gradient text-white' :
                    template.template_type === 'selected' ? 'bg-success text-white' :
                    template.template_type === 'rejected' ? 'bg-danger text-white' : 'bg-slate-900 text-white'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">mail</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-on-surface font-headline leading-tight">{template.name}</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-40">{template.template_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openPreviewModal(template)} className="p-3 bg-white border border-slate-200 rounded-xl text-on-surface-variant hover:text-primary hover:border-primary shadow-sm tonal-transition">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                  </button>
                  <button onClick={() => openEditModal(template)} className="p-3 bg-white border border-slate-200 rounded-xl text-on-surface-variant hover:text-primary hover:border-primary shadow-sm tonal-transition">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => openDeleteModal(template)} className="p-3 bg-white border border-slate-200 rounded-xl text-on-surface-variant hover:text-danger hover:border-danger shadow-sm tonal-transition">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="px-5 py-3 bg-primary/5 rounded-xl border border-primary/10">
                   <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 opacity-40">Protocol Subject</p>
                   <p className="text-sm font-black text-primary truncate">{template.subject}</p>
                </div>
                <p className="text-sm text-on-surface-variant font-medium line-clamp-3 leading-relaxed opacity-70">
                  {template.body}
                </p>
              </div>
            </div>

            <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-200/50 flex justify-between items-center group-hover:bg-white transition-colors">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${
                  template.tone === 'friendly' ? 'bg-primary/10 text-primary ring-primary/20' : 'bg-white text-on-surface-variant ring-slate-200'
                }`}>
                   {template.tone}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Auto-Dispatch</span>
                <button 
                  onClick={() => toggleAutoSend(template)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ring-1 ring-inset ${
                    template.auto_send_enabled ? 'bg-primary ring-primary/20' : 'bg-slate-300 ring-slate-400/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${
                    template.auto_send_enabled ? 'left-7' : 'left-1'
                  }`}></div>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Template Modal - REDESIGNED */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={currentTemplate ? "Modify Protocol" : "Initialize Protocol"}
        subtitle="Define automated communication logic for system-wide signal distribution."
        maxWidth="max-w-4xl"
        footer={(
          <div className="flex gap-4 justify-end w-full">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-slate-50 tonal-transition"
            >
              Abort
            </button>
            <button 
              onClick={handleSaveTemplate}
              className="px-10 py-3 hero-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 tonal-transition hover:scale-105 active:scale-95"
            >
              {currentTemplate ? "Update Protocol" : "Deploy Protocol"}
            </button>
          </div>
        )}
      >
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Protocol Name</label>
              <input 
                type="text" 
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
                placeholder="e.g. Selection Confirmation Alpha"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Protocol Type</label>
              <select 
                value={editFormData.template_type}
                onChange={(e) => setEditFormData({...editFormData, template_type: e.target.value})}
                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 ring-primary/20 transition-all outline-none appearance-none"
              >
                <option value="application_received">Signal: Entry Received</option>
                <option value="selected">Signal: Authorization</option>
                <option value="rejected">Signal: Termination</option>
                <option value="custom">Signal: Manual Protocol</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Target Subject</label>
            <input 
              type="text" 
              value={editFormData.subject}
              onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
              className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
              placeholder="Logic Line Subject..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Signal Body Content</label>
            <textarea 
              value={editFormData.body}
              onChange={(e) => setEditFormData({...editFormData, body: e.target.value})}
              className="w-full px-6 py-6 bg-white border border-slate-200 rounded-[2.5rem] text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none min-h-[300px] leading-relaxed shadow-inner"
              placeholder="Define communication sequence..."
            />
            <div className="flex gap-2 p-2 opacity-50">
               {['applicant_name', 'applied_role', 'company_name'].map(v => (
                 <span key={v} className="px-2 py-1 bg-primary/10 rounded text-[9px] font-black text-primary uppercase">{"{"}{v}{"}"}</span>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Communication Tone</label>
              <select 
                value={editFormData.tone}
                onChange={(e) => setEditFormData({...editFormData, tone: e.target.value})}
                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
              >
                <option value="formal">Protocol: Formal</option>
                <option value="friendly">Protocol: Collaborative</option>
              </select>
            </div>
            <div className="flex flex-col justify-end pb-3">
              <div className="flex items-center gap-4 px-6">
                <button 
                  onClick={() => setEditFormData({...editFormData, auto_send_enabled: !editFormData.auto_send_enabled})}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 ring-1 ring-inset ${
                    editFormData.auto_send_enabled ? 'bg-primary ring-primary/20' : 'bg-slate-300 ring-slate-400/20'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${
                    editFormData.auto_send_enabled ? 'left-8' : 'left-1'
                  }`}></div>
                </button>
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Authorize Auto-Dispatch</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Preview Modal - REDESIGNED */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Signal Preview: ${currentTemplate?.name}`}
        subtitle="Final verification of outbound communication string."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-8 p-4">
          <div className="glass-card bg-white p-8 rounded-[2rem] border-slate-200">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-40 mb-2">Subject Header</p>
            <p className="text-xl font-black text-on-surface font-headline">{currentTemplate?.subject}</p>
          </div>
          <div className="glass-card bg-white p-12 rounded-[2.5rem] border-slate-200 min-h-[400px]">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-40 mb-6">Signal Content</p>
            <div className="whitespace-pre-wrap text-on-surface font-medium leading-relaxed text-sm">
                {currentTemplate?.body}
            </div>
          </div>
          <div className="flex items-center gap-10 px-6 opacity-60">
             <div className="flex flex-col gap-1">
               <span className="text-[9px] font-black text-primary uppercase tracking-widest">Logic Tone</span>
               <span className="text-xs font-black text-on-surface uppercase">{currentTemplate?.tone}</span>
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-[9px] font-black text-primary uppercase tracking-widest">Dispatch Status</span>
               <span className={`text-xs font-black uppercase ${currentTemplate?.auto_send_enabled ? 'text-success' : 'text-slate-400'}`}>
                 {currentTemplate?.auto_send_enabled ? 'Automated' : 'Manual Only'}
               </span>
             </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Decommission Protocol"
        message={`WARNING: You are about to permanently decommission the communication protocol "${currentTemplate?.name}". This action cannot be reversed.`}
        confirmText="Confirm Decommission"
        expectedName={currentTemplate?.name}
        itemName="Protocol Name"
      />
    </div>
  );
};

export default EmailTemplates;
