import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import Modal from '../../components/Modal';

const UserManagement = () => {
  const { showNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'HR',
  });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showNotification("Failed to retrieve staff directory.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', formData);
      showNotification(`Identity for ${formData.full_name} synced successfully.`, "success");
      setShowAddModal(false);
      setFormData({ email: '', full_name: '', password: '', role: 'HR' });
      fetchUsers();
    } catch (error) {
        showNotification(error.response?.data?.detail || 'Handshake failed.', "error");
    }
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
        await api.delete(`/admin/users/${userToDeactivate.id}`);
        showNotification(`Access for ${userToDeactivate.full_name} revoked.`, "success");
        fetchUsers();
    } catch (error) {
        showNotification("Failed to revoke access protocol.", "error");
    } finally {
        setIsDeleteModalOpen(false);
        setUserToDeactivate(null);
    }
  };

  const openDeactivateConfirmation = (user) => {
    setUserToDeactivate(user);
    setIsDeleteModalOpen(true);
  };

  if (loading) return null;

  return (
    <>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Staff Registry</h1>
            <p className="text-on-surface-variant font-medium text-lg">Manage organizational identities and system-wide access protocols.</p>
          </div>
          <button 
             onClick={() => setShowAddModal(true)}
             className="hero-gradient text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3"
          >
            Initialize Access
            <span className="material-symbols-outlined text-sm">person_add</span>
          </button>
        </header>

        <div className="glass-card rounded-[2.5rem] border-white overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-primary uppercase tracking-[0.2em]">Identity Details</th>
                    <th className="px-10 py-6 text-[10px] font-black text-primary uppercase tracking-[0.2em]">Access Class</th>
                    <th className="px-10 py-6 text-[10px] font-black text-primary uppercase tracking-[0.2em]">Status Log</th>
                    <th className="px-10 py-6 text-[10px] font-black text-primary uppercase tracking-[0.2em] text-right">Protocol</th>
                 </tr>
              </thead>
              <tbody>
                 {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xs">
                                {user.full_name[0]}
                             </div>
                             <div>
                                <p className="text-sm font-black text-on-surface">{user.full_name}</p>
                                <p className="text-[10px] text-on-surface-variant font-medium lowercase opacity-60">{user.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <span className={`px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'COFOUNDER' ? 'text-primary' : 'text-secondary'}`}>
                             {user.role}
                          </span>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-success' : 'bg-danger'}`}></div>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? 'text-success' : 'text-danger'}`}>
                                {user.is_active ? 'Active' : 'Deactivated'}
                             </span>
                          </div>
                       </td>
                       <td className="px-10 py-6 text-right">
                          {user.is_active && (
                             <button 
                                onClick={() => openDeactivateConfirmation(user)}
                                className="p-2 text-slate-300 hover:text-danger hover:bg-danger/5 rounded-xl transition-all"
                             >
                                <span className="material-symbols-outlined text-sm">block</span>
                             </button>
                          )}
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Initialize Profile"
        subtitle="Global Staff Registry Protocol"
        maxWidth="max-w-[560px]"
      >
        <form id="add-user-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Display Name</label>
                <input
                required
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                placeholder="E.g., John Doe"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Secure Email Router</label>
                <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                placeholder="john@company.com"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Temporary Security Hash</label>
                <div className="relative">
                <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 pr-14 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                    placeholder="Min 8 chars, 1 num, 1 upper"
                />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {showPassword ? "visibility_off" : "visibility"}
                    </span>
                </button>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Clearance Level</label>
                <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                >
                <option value="HR">HR Recruitment Agent</option>
                <option value="COFOUNDER">Co-founder / Global Admin</option>
                </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-2 border-t border-slate-100">
            <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="sm:flex-1 w-full py-4 bg-white border-2 border-slate-100 hover:bg-slate-50 font-black uppercase tracking-widest text-xs text-slate-500 hover:text-slate-800 rounded-2xl transition-all"
            >
                Cancel
            </button>
            <button
                type="submit"
                className="sm:flex-[2] w-full py-4 hero-gradient text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                Sync Profile Identity
            </button>
            </div>
        </form>
      </Modal>

      <ConfirmationModal
         isOpen={isDeleteModalOpen}
         onClose={() => setIsDeleteModalOpen(false)}
         onConfirm={handleDeactivate}
         title="Revoke System Access"
         message={`CRITICAL: This will immediately deactivate the staff profile for ${userToDeactivate?.full_name}. They will lose access to all HR protocols and recruiter labs.`}
         confirmText="Revoke Access"
         expectedName={userToDeactivate?.full_name}
         itemName="Staff Full Name"
      />
    </>
  );
};

export default UserManagement;
