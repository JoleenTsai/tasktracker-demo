import React from 'react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { motion, AnimatePresence } from 'motion/react';

export const AccountSettings = () => {
  const { orgSettings, updateOrgSettings, user, updateUser, setInviteToTeamOpen, teamMembers, updateMemberRole, removeMember } = useTasks();
  
  const canManageMembers = user.role !== 'Viewer';
  const canEditOrgRules = user.role === 'Admin' || user.role === 'Manager';

  const roleValue = {
    'Admin': 4,
    'Manager': 3,
    'Contributor': 2,
    'Viewer': 1
  };

  const canRemoveMember = (member: { id: string, role: string }) => {
    if (member.id === user.id) return false;
    if (member.role === 'Admin') return false; // Admin protection
    return roleValue[user.role as keyof typeof roleValue] >= roleValue[member.role as keyof typeof roleValue];
  };

  const canChangeMemberRole = (member: { id: string, role: string }) => {
    if (member.id === user.id) return false;
    return roleValue[user.role as keyof typeof roleValue] > roleValue[member.role as keyof typeof roleValue];
  };
  
  // Local state for pending changes
  const [localUser, setLocalUser] = React.useState({...user});
  const [localOrgSettings, setLocalOrgSettings] = React.useState({...orgSettings});
  
  const [activeTab, setActiveTab] = React.useState<'personal' | 'org' | 'team'>('personal');
  const [newItem, setNewItem] = React.useState({ type: '', value: '' });
  const [isSaving, setIsSaving] = React.useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync local state if external data changes (and we're not saving)
  React.useEffect(() => {
    if (!isSaving) {
      setLocalUser({...user});
      setLocalOrgSettings({...orgSettings});
    }
  }, [user, orgSettings, isSaving]);

  const handleSave = () => {
    setIsSaving(true);
    
    // Commit pending changes to context
    updateUser({ ...localUser });
    updateOrgSettings({ ...localOrgSettings });

    // Simulate API call delay for UX
    setTimeout(() => {
      setIsSaving(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }, 600);
  };

  const handleCancel = () => {
    setLocalUser({...user});
    setLocalOrgSettings({...orgSettings});
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalUser(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAddItem = (type: 'categories' | 'statuses' | 'phases') => {
    if (!newItem.value.trim()) return;
    const current = [...localOrgSettings[type]];
    if (!current.includes(newItem.value)) {
      setLocalOrgSettings(prev => ({ ...prev, [type]: [...current, newItem.value] }));
    }
    setNewItem({ type: '', value: '' });
  };

  const handleRemoveItem = (type: 'categories' | 'statuses' | 'phases', index: number) => {
    const current = [...localOrgSettings[type]];
    current.splice(index, 1);
    setLocalOrgSettings(prev => ({ ...prev, [type]: current }));
  };

  return (
    <>
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-10 right-10 z-[201] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20"
          >
            <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center">
              <Icons.Check className="h-4 w-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Settings Saved Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl space-y-8 pb-20"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your professional environment and organization defaults.</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 self-start md:self-auto">
          <button 
            onClick={() => setActiveTab('personal')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'personal' 
                ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Personal
          </button>
          <button 
            onClick={() => setActiveTab('org')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'org' 
                ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Organization
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'team' 
                ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Team
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-8 space-y-8">
          {activeTab === 'personal' && (
            <>
              <section className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Profile Media</h3>
              <p className="text-xs text-slate-500 mt-1">This will be displayed on your profile and tasks.</p>
            </div>
            <div className="flex items-center gap-6">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <div 
                onClick={triggerFileInput}
                className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl group cursor-pointer"
              >
                <img src={localUser.avatar} alt={localUser.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Icons.Plus className="text-white h-6 w-6" />
                </div>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={triggerFileInput}
                  className="px-4 py-2 bg-primary-container text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  Change Avatar
                </button>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SVG, PNG, JPG or GIF (max. 400x400px)</p>
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <section className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Personal Info</h3>
              <p className="text-xs text-slate-500 mt-1">Update your name and professional role.</p>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                <input 
                  type="text" 
                  value={localUser.name}
                  onChange={(e) => setLocalUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-container/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Job Title</label>
                <input 
                  type="text" 
                  value={localUser.role}
                  onChange={(e) => setLocalUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-container/20 outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                <input 
                  type="email" 
                  value={localUser.email}
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <section className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Preferences</h3>
              <p className="text-xs text-slate-500 mt-1">Configure your workspace behavior and external integrations.</p>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Email Notifications</p>
                  <p className="text-[10px] text-slate-500 font-medium">Receive weekly updates and task assignments.</p>
                </div>
                <div 
                  onClick={() => setLocalUser(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences!, notifications: !prev.preferences?.notifications }
                  }))}
                  className={cn(
                    "w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors",
                    localUser.preferences?.notifications ? "bg-primary-container" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 h-3 w-3 bg-white rounded-full transition-all",
                    localUser.preferences?.notifications ? "right-1" : "left-1"
                  )} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Icons.Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Google Calendar Sync</p>
                    <p className="text-[10px] text-slate-500 font-medium">Automatically create calendar events on task due dates.</p>
                  </div>
                </div>
                <div 
                  onClick={() => setLocalUser(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences!, calendarSync: !prev.preferences?.calendarSync }
                  }))}
                  className={cn(
                    "w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors",
                    localUser.preferences?.calendarSync ? "bg-primary-container" : "bg-slate-200 dark:bg-slate-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 h-3 w-3 bg-white rounded-full transition-all",
                    localUser.preferences?.calendarSync ? "right-1" : "left-1"
                  )} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Icons.Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Personalized Reminders</p>
                      <p className="text-[10px] text-slate-500 font-medium">Create custom alerts for outstanding tasks.</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setLocalUser(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences!, reminders: !prev.preferences?.reminders }
                    }))}
                    className={cn(
                      "w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors",
                      localUser.preferences?.reminders ? "bg-primary-container" : "bg-slate-200 dark:bg-slate-800"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 h-3 w-3 bg-white rounded-full transition-all",
                      localUser.preferences?.reminders ? "right-1" : "left-1"
                    )} />
                  </div>
                </div>

                <AnimatePresence>
                  {localUser.preferences?.reminders && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800"
                    >
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reminders Cadence</p>
                      <div className="space-y-3">
                        {localUser.preferences?.cadence.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight w-20">{item.label}</span>
                            <div className="flex-1 flex gap-2">
                              <input 
                                type="number"
                                value={item.value}
                                onChange={(e) => {
                                  const newCadence = localUser.preferences!.cadence.map((item, i) => 
                                    i === idx ? { ...item, value: parseInt(e.target.value) || 0 } : item
                                  );
                                  setLocalUser(prev => ({
                                    ...prev,
                                    preferences: { ...prev.preferences!, cadence: newCadence }
                                  }));
                                }}
                                className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary-container/20 outline-none"
                              />
                              <select 
                                value={item.unit}
                                onChange={(e) => {
                                  const newCadence = localUser.preferences!.cadence.map((item, i) => 
                                    i === idx ? { ...item, unit: e.target.value } : item
                                  );
                                  setLocalUser(prev => ({
                                    ...prev,
                                    preferences: { ...prev.preferences!, cadence: newCadence }
                                  }));
                                }}
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none"
                              >
                                <option value="days">Days Prior</option>
                                <option value="weeks">Weeks Prior</option>
                                <option value="hours">Hours Prior</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium italic"> Alerts will only trigger if tasks are still outstanding.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'org' && (
            <div className="space-y-12">
              <section className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg">Member Invitations</h3>
                  <p className="text-xs text-slate-500 mt-1">Scale your organization by inviting specialists and collaborators.</p>
                </div>
                <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-primary-container">
                    <Icons.Group className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Growth & Scale</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Invite team members to begin collaborating</p>
                  </div>
                  <button 
                    onClick={() => setInviteToTeamOpen(true)}
                    className="mt-2 px-8 py-3 bg-primary-container text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Icons.Plus className="h-4 w-4" />
                    Invite Team
                  </button>
                </div>
              </section>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <section className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Project Categories</h3>
                  <p className="text-xs text-slate-500 mt-1">Define the high-level domains for your company projects.</p>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex flex-wrap gap-2">
                    {localOrgSettings.categories.map((cat, i) => (
                      <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        {cat}
                        {canEditOrgRules && (
                          <button onClick={() => handleRemoveItem('categories', i)} className="hover:text-error transition-colors">
                            <Icons.Plus className="h-3 w-3 rotate-45" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {canEditOrgRules && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="New category name..."
                        value={newItem.type === 'categories' ? newItem.value : ''}
                        onChange={(e) => setNewItem({ type: 'categories', value: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem('categories')}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary-container/20 outline-none"
                      />
                      <button 
                        onClick={() => handleAddItem('categories')}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <section className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Project Statuses</h3>
                  <p className="text-xs text-slate-500 mt-1">Status options available for all projects in your organization.</p>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex flex-wrap gap-2">
                    {localOrgSettings.statuses.map((status, i) => (
                      <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        {status}
                        {canEditOrgRules && (
                          <button onClick={() => handleRemoveItem('statuses', i)} className="hover:text-error transition-colors">
                            <Icons.Plus className="h-3 w-3 rotate-45" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {canEditOrgRules && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="New status name..."
                        value={newItem.type === 'statuses' ? newItem.value : ''}
                        onChange={(e) => setNewItem({ type: 'statuses', value: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem('statuses')}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary-container/20 outline-none"
                      />
                      <button 
                        onClick={() => handleAddItem('statuses')}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <section className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Project Phases</h3>
                  <p className="text-xs text-slate-500 mt-1">Lifecycle segments used to track project progression.</p>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex flex-wrap gap-2">
                    {localOrgSettings.phases.map((phase, i) => (
                      <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        {phase}
                        {canEditOrgRules && (
                          <button onClick={() => handleRemoveItem('phases', i)} className="hover:text-error transition-colors">
                            <Icons.Plus className="h-3 w-3 rotate-45" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {canEditOrgRules && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="New phase name..."
                        value={newItem.type === 'phases' ? newItem.value : ''}
                        onChange={(e) => setNewItem({ type: 'phases', value: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem('phases')}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary-container/20 outline-none"
                      />
                      <button 
                        onClick={() => handleAddItem('phases')}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Team Directory</h3>
                    <p className="text-xs text-slate-500 mt-1">Manage users and permissions across your workspace.</p>
                  </div>
                  {canManageMembers && (
                    <button 
                      onClick={() => setInviteToTeamOpen(true)}
                      className="px-6 py-2.5 bg-primary-container text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Icons.Plus className="h-3.5 w-3.5" />
                      Invite New
                    </button>
                  )}
                </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left bg-transparent">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Email</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={member.avatar} className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm" alt="" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{member.email}</span>
                            <span className="text-[9px] font-bold text-slate-400">ID: {member.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {canChangeMemberRole(member) ? (
                            <select 
                              value={member.role}
                              onChange={(e) => updateMemberRole(member.id, e.target.value as any)}
                              className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer"
                            >
                              {Object.keys(roleValue).filter(r => roleValue[r as keyof typeof roleValue] <= roleValue[user.role as keyof typeof roleValue]).map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                              member.role === 'Admin' || member.role === 'Manager' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                            )}>
                              {member.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-1.5 w-1.5 rounded-full", member.status === 'Active' ? "bg-emerald-500" : "bg-slate-400")} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{member.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canRemoveMember(member) && (
                            <button 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
                                  removeMember(member.id);
                                }
                              }}
                              className="p-2 text-slate-300 hover:text-error transition-colors"
                              title="Remove Member"
                            >
                              <Icons.Delete className="h-4 w-4" />
                            </button>
                          )}
                          <button className="text-slate-300 hover:text-slate-900 dark:hover:text-white p-2">
                            <Icons.More className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20 rounded-2xl flex items-start gap-4">
                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <Icons.HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100 uppercase tracking-tight">Access Control Pro-Tip</p>
                  <p className="text-xs text-amber-800/70 dark:text-amber-200/60 mt-1 leading-relaxed">
                    Default roles can be overridden at the project level. Admin/Managers have full control, Contributors can manage tasks and invites, and Viewers have read-only access (with commenting).
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-12">
                  <header>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Role Permissions Guide</h3>
                    <p className="text-xs text-slate-500 mt-1">Understanding access levels and operational authority across your workspace.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RoleCard 
                      role="Viewer" 
                      icon={<Icons.Search className="h-5 w-5" />}
                      color="slate"
                      description="Read-only access to all projects and tasks. Perfect for stakeholders who need visibility without operational impact."
                      permissions={[
                        "View all tasks and projects",
                        "Monitor progress metrics",
                        "Add comments & feedback",
                        "View activity logs"
                      ]}
                    />
                    <RoleCard 
                      role="Contributor" 
                      icon={<Icons.Edit className="h-5 w-5" />}
                      color="indigo"
                      description="Enhanced operational access. Designed for active team members who manage daily execution."
                      permissions={[
                        "Create, edit, and delete tasks",
                        "Create and edit projects",
                        "Manage subtasks",
                        "Invite & remove members (lower roles)"
                      ]}
                    />
                    <RoleCard 
                      role="Manager" 
                      icon={<Icons.Settings className="h-5 w-5" />}
                      color="amber"
                      description="Administrative oversight. Authority to shape the organization's structure and manage resources."
                      permissions={[
                        "All Contributor permissions",
                        "Delete projects",
                        "Modify Org rules (Phases, Categories)",
                        "Override project defaults"
                      ]}
                    />
                    <RoleCard 
                      role="Admin" 
                      icon={<Icons.Shield className="h-5 w-5" />}
                      color="emerald"
                      description="System-level authority. Core maintainers of the organization who ensure operational continuity."
                      permissions={[
                        "All Manager permissions",
                        "Immutable (Cannot be removed)",
                        "Assign Admin roles to others",
                        "Full organizational control"
                      ]}
                    />
                  </div>

                  <div className="p-6 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-3xl flex items-start gap-4">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                      <Icons.Info className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-tight">Managing Hierarchy</p>
                      <p className="text-xs text-blue-800/70 dark:text-blue-200/60 mt-1 leading-relaxed">
                        Access is hierarchical. Users can generally manage (invite, remove, or change roles) for any user whose role level is lower than their own. Managers and Admins have additional authority to modify global settings that affect the entire organization.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 flex justify-end gap-3">
          <button 
            onClick={handleCancel}
            className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 bg-primary-container text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Icons.Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </motion.div>
    </>
  );
};

const RoleCard = ({ role, icon, description, permissions, color }: any) => {
  const colorStyles: any = {
    slate: "bg-slate-100 dark:bg-slate-800/10 text-slate-500 border-slate-200",
    indigo: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-500 border-indigo-200",
    amber: "bg-amber-100 dark:bg-amber-500/10 text-amber-500 border-amber-200",
    emerald: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 border-emerald-200",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 hover:border-primary-container/20 transition-all shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", colorStyles[color])}>
          {icon}
        </div>
        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{role}</h4>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
        {description}
      </p>
      <div className="space-y-2 pt-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Capabilities</p>
        <ul className="space-y-1.5">
          {permissions.map((p: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-500">
              <Icons.Check className="h-3 w-3 mt-0.5 text-primary-container shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
