import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';

export const GlobalInviteModal = () => {
  const { inviteToTeamOpen, setInviteToTeamOpen, projects, inviteToProject, inviteToOrg, user } = useTasks();
  const [email, setEmail] = React.useState('');
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | 'org'>('org');
  const [selectedRole, setSelectedRole] = React.useState('Viewer');
  const [isInviting, setIsInviting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const canAssignRole = user.role !== 'Viewer';

  const handleInvite = async () => {
    if (!email.includes('@')) return;
    setIsInviting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (selectedProjectId === 'org') {
      inviteToOrg(email, selectedRole as any);
    } else {
      inviteToProject(selectedProjectId, email, selectedRole as any);
    }
    
    setIsInviting(false);
    setSuccess(true);
    
    setTimeout(() => {
      setSuccess(false);
      setInviteToTeamOpen(false);
      setEmail('');
      setSelectedProjectId('org');
      setSelectedRole('Viewer');
    }, 2000);
  };

  const getAvailableRoles = () => {
    if (user.role === 'Admin') {
      return ['Viewer', 'Contributor', 'Manager', 'Admin'];
    }
    if (user.role === 'Manager') {
      return ['Viewer', 'Contributor', 'Manager'];
    }
    if (user.role === 'Contributor') {
      return ['Viewer', 'Contributor'];
    }
    return ['Viewer'];
  };

  return (
    <AnimatePresence>
      {inviteToTeamOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          onClick={() => setInviteToTeamOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Invite Members</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Grow your high-performance team.</p>
                </div>
                <button 
                  onClick={() => setInviteToTeamOpen(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Icons.Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10"
                >
                  <div className="h-20 w-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                    <Icons.Check className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Invitation Sent!</h3>
                  <p className="text-slate-500 text-sm font-medium mt-2">Checking inbox for {email}</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-container transition-colors">
                        <Icons.At className="h-4 w-4" />
                      </div>
                      <input 
                        autoFocus
                        type="email" 
                        placeholder="colleague@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-4 focus:ring-primary-container/10 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invite To</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-container transition-colors">
                          <Icons.Folder className="h-4 w-4" />
                        </div>
                        <select 
                          value={selectedProjectId}
                          onChange={e => setSelectedProjectId(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-10 py-4 text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-primary-container/10 outline-none transition-all appearance-none"
                        >
                          <option value="org">Full Organization (All Access)</option>
                          <optgroup label="Specific Boards">
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </optgroup>
                        </select>
                        <Icons.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Role</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-container transition-colors">
                          <Icons.Shield className="h-4 w-4" />
                        </div>
                        <select 
                          value={selectedRole}
                          disabled={!canAssignRole}
                          onChange={e => setSelectedRole(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-10 py-4 text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-primary-container/10 outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {getAvailableRoles().map(role => (
                            <option key={role} value={role}>{role} {role === 'Viewer' ? '(Default)' : ''}</option>
                          ))}
                        </select>
                        <Icons.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                      {!canAssignRole && (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight ml-1">ONLY CONTRIBUTORS OR HIGHER CAN INVITE</p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={handleInvite}
                    disabled={!email.includes('@') || isInviting}
                    className="w-full py-5 bg-primary-container text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-container/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                  >
                    {isInviting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Invitation...</span>
                      </>
                    ) : (
                      <>
                        <Icons.Plus className="h-4 w-4" />
                        <span>Send Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
