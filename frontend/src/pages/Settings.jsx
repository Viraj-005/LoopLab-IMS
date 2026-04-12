import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bell, 
  ShieldCheck, 
  Users, 
  Save,
  MoreVertical 
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('organization');
  const [orgName, setOrgName] = useState('LOOPLAB');
  const [contactEmail, setContactEmail] = useState('hr@looplab.io');
  const [website, setWebsite] = useState('https://looplab.io');
  
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('ims_notifications');
    return saved ? JSON.parse(saved) : {
      newApplications: true,
      duplicateDetection: true,
      selectionAlerts: true,
      spamAlerts: false,
      statusChanges: true
    };
  });

  const [securitySettings, setSecuritySettings] = useState(() => {
    const saved = localStorage.getItem('ims_security_settings');
    return saved ? JSON.parse(saved) : {
      enableSpamDetection: true,
      enableDuplicateDetection: true,
      twoFactor: false
    };
  });

  
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const savedOrg = localStorage.getItem('ims_org');
    if (savedOrg) {
      const data = JSON.parse(savedOrg);
      setOrgName(data.name);
      setContactEmail(data.email);
      setWebsite(data.website);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('ims_org', JSON.stringify({ name: orgName, email: contactEmail, website }));
    localStorage.setItem('ims_notifications', JSON.stringify(notifications));
    localStorage.setItem('ims_security_settings', JSON.stringify(securitySettings));
    localStorage.setItem('ims_appearance', JSON.stringify(appearance));
    
    // Trigger global update
    window.dispatchEvent(new Event('ims_appearance_changed'));
    
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'team', label: 'Team Members', icon: Users },
  ];

  const handleToggle = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('ims_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSecurityToggle = (key) => {
    setSecuritySettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('ims_security_settings', JSON.stringify(updated));
      return updated;
    });
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
                <span className="text-success text-sm font-bold animate-pulse flex items-center gap-2">
                  <ShieldCheck size={18} /> Settings saved successfully!
                </span>
              )}
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 border border-slate-800 dark:border-blue-400/30"
              >
                <Save size={20} />
                Save Changes
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
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 focus:bg-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-sm font-bold text-slate-900">New Password</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-950 focus:bg-white outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSuccess(true);
                        setTimeout(() => setSuccess(false), 3000);
                      }}
                      className="px-6 py-3 bg-slate-100 text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                    >
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

              {/* Spam Detection Card from Image */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Spam Detection</h2>
                <p className="text-sm text-slate-500 mb-10">Configure spam detection sensitivity and rules</p>

                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900">Enable Spam Detection</h3>
                      <p className="text-sm text-slate-500">Automatically flag suspicious applications</p>
                    </div>
                    <button 
                      onClick={() => handleSecurityToggle('enableSpamDetection')}
                      className={`w-14 h-7 rounded-full transition-all duration-300 relative ${securitySettings.enableSpamDetection ? 'bg-slate-900 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white toggle-handle rounded-full transition-all shadow-sm ${securitySettings.enableSpamDetection ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900">Enable Duplicate Detection</h3>
                      <p className="text-sm text-slate-500">Flag applications from the same email address</p>
                    </div>
                    <button 
                      onClick={() => handleSecurityToggle('enableDuplicateDetection')}
                      className={`w-14 h-7 rounded-full transition-all duration-300 relative ${securitySettings.enableDuplicateDetection ? 'bg-slate-900 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white toggle-handle rounded-full transition-all shadow-sm ${securitySettings.enableDuplicateDetection ? 'left-8' : 'left-1'}`} />
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
                  <p className="text-sm text-slate-500">Manage your organization's members and their roles</p>
                </div>
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-600">
                   3 Members
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { name: "S.H.Dinusha Madhujith", role: "CEO", email: "ceo@looplab.io" },
                  { name: "I.A.V.P.Sangeeth Induruwa", role: "CTO", email: "cto@looplab.io" },
                  { name: "W.A.Pawani Nimasha", role: "CFO", email: "cfo@looplab.io" }
                ].map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-full border-4 border-white shadow-sm flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                          {member.name[0]}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-slate-950">{member.name}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">{member.role}</span>
                          <span className="text-xs text-slate-400 font-medium">{member.email}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default Settings;
