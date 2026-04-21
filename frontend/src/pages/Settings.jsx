import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, 
  Bell, 
  ShieldCheck, 
  Users, 
  Save,
  MoreVertical,
  Plus,
  Trash2,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  ShieldAlert
} from 'lucide-react';
import settingsService from '../services/settingsService';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';

const Settings = () => {
  // Guarded role detection
  const getUserData = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  const currentUser = getUserData();
  const userRole = currentUser?.role;
  const isHR = userRole === 'HR';
  const isAdminOrCofounder = userRole === 'ADMIN' || userRole === 'COFOUNDER';

  const [activeTab, setActiveTab] = useState(isAdminOrCofounder ? 'organization' : 'notifications');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [orgName, setOrgName] = useState('LOOPLAB');
  const [contactEmail, setContactEmail] = useState('looplab888@gmail.com');
  const [website, setWebsite] = useState('https://looplab.lk');
  const [notifications, setNotifications] = useState({
    newApplications: true,
    duplicateDetection: true,
    selectionAlerts: true,
    spamAlerts: false,
    statusChanges: true
  });
  const [securitySettings, setSecuritySettings] = useState({
    enableSpamDetection: true,
    enableDuplicateDetection: true,
    twoFactor: false
  });

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Team state
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    full_name: '',
    email: '',
    role: 'HR',
    password: ''
  });

  // 2FA Specific State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState({ secret: '', qr_code_url: '' });
  const [twoFAVerifyCode, setTwoFAVerifyCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = getUserData();
      const role = user?.role;
      const canAccessAdmin = role === 'ADMIN' || role === 'COFOUNDER';

      const settings = await settingsService.getSettings();
      setOrgName(settings.org_name);
      setContactEmail(settings.contact_email);
      setWebsite(settings.website);
      setNotifications({
        newApplications: settings.notify_new_applications,
        duplicateDetection: settings.notify_duplicate_detection,
        selectionAlerts: true,
        spamAlerts: settings.notify_spam_alerts,
        statusChanges: settings.notify_status_changes
      });
      setSecuritySettings({
        enableSpamDetection: settings.enable_spam_detection,
        enableDuplicateDetection: settings.enable_duplicate_detection,
        twoFactor: user?.is_2fa_enabled || false
      });

      // Strictly only fetch team members if role is privileged
      if (canAccessAdmin) {
        const members = await settingsService.getTeamMembers();
        setTeamMembers(members);
      } else {
        // Force tab if it was set to one they can't access
        setActiveTab('notifications');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      // If it's a 403, we probably hit an admin-only endpoint by mistake
      if (err.response?.status === 403) {
        // Just fail silently for the admin part or show a specific message
        console.warn('Unauthorized settings access attempt');
      } else {
        setError('Failed to load settings from server');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await settingsService.updateSettings({
        org_name: orgName,
        contact_email: contactEmail,
        website: website,
        notify_new_applications: notifications.newApplications,
        notify_duplicate_detection: notifications.duplicateDetection,
        notify_spam_alerts: notifications.spamAlerts,
        notify_status_changes: notifications.statusChanges,
        enable_spam_detection: securitySettings.enableSpamDetection,
        enable_duplicate_detection: securitySettings.enableDuplicateDetection
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await settingsService.changePassword({
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword
      });
      setSuccess(true);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    setLoading(true);
    setError(null);
    try {
      await settingsService.addTeamMember(newMember);
      const updatedMembers = await settingsService.getTeamMembers();
      setTeamMembers(updatedMembers);
      setShowAddMemberModal(false);
      setNewMember({ full_name: '', email: '', role: 'HR', password: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateMember = async (id) => {
    setConfirmModal({
        isOpen: true,
        title: "Deactivate Member",
        message: "Are you sure you want to deactivate this member? They will lose access to the system.",
        confirmText: "Deactivate",
        onConfirm: async () => {
            setLoading(true);
            try {
              await settingsService.deactivateTeamMember(id);
              const updatedMembers = await settingsService.getTeamMembers();
              setTeamMembers(updatedMembers);
            } catch (err) {
              setError('Failed to deactivate member');
            } finally {
              setLoading(false);
            }
        }
    });
  };

  const allTabs = [
    { id: 'organization', label: 'Organization', icon: Building2, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: false },
    { id: 'security', label: 'Security', icon: ShieldCheck, adminOnly: false },
    { id: 'team', label: 'Team Members', icon: Users, adminOnly: true },
  ];
  
  const tabs = allTabs.filter(tab => !tab.adminOnly || isAdminOrCofounder);

  const handleToggle = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('ims_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSecurityToggle = (key) => {
    if (key === 'twoFactor') {
      if (!securitySettings.twoFactor) {
        initiate2FASetup();
      } else {
        // Disable logic
        setConfirmModal({
            isOpen: true,
            title: "Security Downgrade",
            message: "Disabling Two-Factor Authentication will reduce your account's security protocols. Proceed?",
            confirmText: "Deactivate 2FA",
            onConfirm: () => setShow2FAModal(true)
        });
      }
      return;
    }
    setSecuritySettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      return updated;
    });
  };

  const initiate2FASetup = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/2fa/setup');
      setTwoFASetup(res.data);
      setShow2FAModal(true);
    } catch (err) {
      setError('System failure in initializing 2FA security protocol.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setVerifying2FA(true);
    try {
      const endpoint = securitySettings.twoFactor ? '/auth/2fa/disable' : '/auth/2fa/enable';
      await api.post(endpoint, { code: twoFAVerifyCode });
      
      const newStatus = !securitySettings.twoFactor;
      setSecuritySettings(prev => ({ ...prev, twoFactor: newStatus }));
      
      // Update local user obj
      const user = JSON.parse(localStorage.getItem('user'));
      user.is_2fa_enabled = newStatus;
      localStorage.setItem('user', JSON.stringify(user));
      
      setSuccess(true);
      setShow2FAModal(false);
      setTwoFAVerifyCode('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failure. Security code mismatch.');
    } finally {
      setVerifying2FA(false);
    }
  };



  return (
    <div className="w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium pt-1">Manage your application settings and preferences</p>
      </div>

      <div className="flex gap-10">
        {/* Sidebar Tabs */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold transition-all duration-200 rounded-xl ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg shadow-slate-200 dark:shadow-none' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8 max-w-5xl">
          {activeTab === 'organization' && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Organization Settings</h2>
                <p className="text-sm text-slate-500 mb-10">Configure your organization details and preferences</p>

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Organization Name</label>
                    <input 
                      type="text" 
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 focus:bg-white outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Contact Email</label>
                    <input 
                      type="email" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 focus:bg-white outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-2.5">
                  <label className="text-sm font-bold text-slate-900">Website</label>
                  <input 
                    type="url" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
              </div>

            </>
          )}

          {/* Global Save Button */}
          {activeTab !== 'team' && (
            <div className="flex items-center justify-end gap-6 pt-6">
              {success && (
                <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-2 font-bold mb-6 animate-in slide-in-from-top duration-300">
                  <CheckCircle2 size={18} /> Settings saved successfully!
                </div>
              )}
              {error && (
                <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-2 font-bold mb-6 animate-in slide-in-from-top duration-300">
                  <XCircle size={18} /> {error}
                </div>
              )}
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 border border-slate-800 dark:border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Notification Preferences</h2>
              <p className="text-sm text-slate-500 mb-10">Choose how you want to be notified about application updates</p>

              <div className="space-y-10">
                <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900">New Applications</h3>
                    <p className="text-sm text-slate-500">Get notified when new applications are received</p>
                  </div>
                  <button 
                    onClick={() => handleToggle('newApplications')}
                    className={`w-14 h-7 rounded-full transition-all duration-300 border relative ${notifications.newApplications ? 'bg-slate-900 dark:bg-blue-600 border-slate-800 dark:border-blue-400/50' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white toggle-handle rounded-full transition-all shadow-sm ${notifications.newApplications ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900">Duplicate Detection</h3>
                    <p className="text-sm text-slate-500">Get notified when potential duplicates are found</p>
                  </div>
                  <button 
                    onClick={() => handleToggle('duplicateDetection')}
                    className={`w-14 h-7 rounded-full transition-all duration-300 border relative ${notifications.duplicateDetection ? 'bg-slate-900 dark:bg-blue-600 border-slate-800 dark:border-blue-400/50' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white toggle-handle rounded-full transition-all shadow-sm ${notifications.duplicateDetection ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900">Spam Detection</h3>
                    <p className="text-sm text-slate-500">Get notified when applications are flagged as spam</p>
                  </div>
                  <button 
                    onClick={() => handleToggle('spamAlerts')}
                    className={`w-14 h-7 rounded-full transition-all duration-300 border relative ${notifications.spamAlerts ? 'bg-slate-900 dark:bg-blue-600 border-slate-800 dark:border-blue-400/50' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white toggle-handle rounded-full transition-all shadow-sm ${notifications.spamAlerts ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900">Status Changes</h3>
                    <p className="text-sm text-slate-500">Get notified when application statuses change</p>
                  </div>
                  <button 
                    onClick={() => handleToggle('statusChanges')}
                    className={`w-14 h-7 rounded-full transition-all duration-300 border relative ${notifications.statusChanges ? 'bg-slate-900 dark:bg-blue-600 border-slate-800 dark:border-blue-400/50' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white toggle-handle rounded-full transition-all shadow-sm ${notifications.statusChanges ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Security Settings</h2>
                <p className="text-sm text-slate-500 mb-10">Manage your account security and authentication</p>

                <div className="space-y-10">
                  <div className="space-y-6">
                    <h3 className="font-bold text-slate-900 border-b border-slate-50 pb-2">Change Password</h3>
                    <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-2.5">
                        <label className="text-sm font-bold text-slate-900">Current Password</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={passwords.currentPassword}
                          onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 focus:bg-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-sm font-bold text-slate-900">New Password</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 focus:bg-white outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5 max-w-sm">
                      <label className="text-sm font-bold text-slate-900">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <button 
                      onClick={handlePasswordChange}
                      disabled={loading}
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                      Update Password
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-lg">Two-Factor Authentication</h3>
                      <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                    </div>
                    <button 
                      onClick={() => handleSecurityToggle('twoFactor')}
                      className={`w-14 h-7 rounded-full transition-all duration-300 relative ${securitySettings.twoFactor ? 'bg-slate-900 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white toggle-handle rounded-full transition-all shadow-sm ${securitySettings.twoFactor ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Team Members</h2>
                  <p className="text-sm text-slate-500">View your organization's members and their roles. Manage users in the Staff Registry.</p>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-2 font-bold mb-6">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="space-y-6">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Users className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-bold">No team members found</p>
                  </div>
                ) : (
                  teamMembers.map((member, idx) => (
                    <div key={member.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-full border-4 border-white shadow-sm flex items-center justify-center overflow-hidden">
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg uppercase">
                            {member.full_name[0]}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-slate-950">{member.full_name}</h4>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter ${
                              member.role === 'COFOUNDER' || member.role === 'ADMIN' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-900 text-white'
                            }`}>{member.role}</span>
                            <span className="text-xs text-slate-400 font-medium">{member.email}</span>
                            {!member.is_active && (
                              <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md font-bold uppercase">Deactivated</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.is_active && (
                          <button 
                            onClick={() => handleDeactivateMember(member.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Deactivate Member"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Add Member Modal — Refactored to use standardized Portal-based Modal */}
          <Modal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            title="Add Team Member"
            subtitle="Create a new staff account for your organization"
            maxWidth="max-w-lg"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 ml-1">Full Name</label>
                <input 
                  type="text"
                  value={newMember.full_name}
                  onChange={(e) => setNewMember({...newMember, full_name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 outline-none transition-all font-medium"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 ml-1">Email Address</label>
                <input 
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 outline-none transition-all font-medium"
                  placeholder="staff@looplab.io"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 ml-1">Role</label>
                  <select 
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 outline-none appearance-none cursor-pointer font-medium"
                  >
                    <option value="HR">HR</option>
                    <option value="COFOUNDER">COFOUNDER</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 ml-1">Temporary Password</label>
                  <input 
                    type="password"
                    value={newMember.password}
                    onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all font-headline uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddMember}
                  disabled={loading || !newMember.email || !newMember.password}
                  className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50 font-headline uppercase tracking-widest text-[10px]"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Create Account'}
                </button>
              </div>
            </div>
          </Modal>

          {/* 2FA Setup/Disable Modal — Using Portal for global coverage */}
          {show2FAModal && createPortal(
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={() => setShow2FAModal(false)}></div>
                
                <div className="relative bg-white rounded-[2rem] w-full max-w-[560px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-slate-900/5">
                    
                    {/* Dynamic Banner Header */}
                    <div className={`px-10 py-8 border-b ${securitySettings.twoFactor ? 'bg-rose-50 border-rose-100/60' : 'bg-slate-50 border-slate-100/60'} flex items-center gap-5`}>
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm bg-white ${securitySettings.twoFactor ? 'text-rose-500' : 'text-slate-900'}`}>
                            <span className="material-symbols-outlined text-3xl">
                                {securitySettings.twoFactor ? 'shield_minus' : 'shield_lock'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 font-headline uppercase tracking-tight">
                                {securitySettings.twoFactor ? 'Disable Security' : 'Enable 2FA'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">Multi-factor authentication protocol</p>
                        </div>
                    </div>

                    <div className="px-10 py-8 space-y-8">
                        {/* Content */}
                        {!securitySettings.twoFactor && (
                            <div className="flex flex-col sm:flex-row gap-8 items-center bg-white">
                                <div className="shrink-0 p-3 bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
                                    <img 
                                        src={twoFASetup.qr_code_url} 
                                        alt="2FA QR Code" 
                                        loading="lazy"
                                        onLoad={(e) => e.target.style.opacity = 1}
                                        className="w-36 h-36 opacity-0 transition-opacity duration-500" 
                                    />
                                </div>
                                <div className="space-y-5 flex-1 w-full text-center sm:text-left">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900">Scan QR Pattern</p>
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                            Open Google Authenticator, Authy, or your preferred 2FA app to scan this secure signal.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual Key</p>
                                        <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 inline-block w-full text-center sm:text-left">
                                            <code className="text-[11px] font-black text-slate-700 tracking-[0.15em] select-all">{twoFASetup.secret}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className={`space-y-4 ${!securitySettings.twoFactor ? 'pt-6 border-t border-slate-100/70' : ''}`}>
                            <div className="text-center sm:text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {securitySettings.twoFactor ? 'Verify Deactivation Code' : 'Verify Authenticator Code'}
                                </p>
                            </div>
                            <input
                                autoFocus
                                type="text"
                                maxLength="6"
                                value={twoFAVerifyCode}
                                onChange={(e) => setTwoFAVerifyCode(e.target.value.replace(/\D/g, ''))}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-center text-3xl tracking-[0.4em] font-black outline-none transition-all placeholder-slate-300 focus:bg-white focus:ring-4 ${securitySettings.twoFactor ? 'focus:border-rose-300 focus:ring-rose-500/10 text-rose-600' : 'focus:border-slate-300 focus:ring-slate-900/5 text-slate-900'}`}
                                placeholder="••••••"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-6">
                            <button
                                onClick={() => setShow2FAModal(false)}
                                className="sm:flex-1 w-full h-[64px] rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-800 transition-all border-2 border-slate-100"
                            >
                                Cancel Sequence
                            </button>
                            <button
                                onClick={handleVerify2FA}
                                disabled={verifying2FA || twoFAVerifyCode.length < 6}
                                className={`sm:flex-[2] w-full h-[64px] rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
                                    securitySettings.twoFactor 
                                    ? 'bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700 active:scale-[0.98]' 
                                    : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-black active:scale-[0.98]'
                                }`}
                            >
                                {verifying2FA ? (
                                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                   <>
                                     <span>{securitySettings.twoFactor ? 'Confirm Deactivation' : 'Enable Security Layer'}</span>
                                     <span className="material-symbols-outlined text-[18px]">
                                         {securitySettings.twoFactor ? 'warning' : 'verified_user'}
                                     </span>
                                   </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>,
            document.getElementById('modal-root')
          )}

          <ConfirmationModal
              isOpen={confirmModal.isOpen}
              onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              onConfirm={confirmModal.onConfirm}
              title={confirmModal.title}
              message={confirmModal.message}
              confirmText={confirmModal.confirmText}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
