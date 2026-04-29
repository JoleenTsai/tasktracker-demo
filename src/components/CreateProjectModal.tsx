import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { users } from '../constants';
import DatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';

export const CreateProjectModal = () => {
  const { 
    isProjectModalOpen, 
    setProjectModalOpen, 
    addProject, 
    updateProject,
    projects,
    selectedProjectId,
    orgSettings, 
    addOrgCategory, 
    addOrgPhase, 
    addOrgStatus 
  } = useTasks();

  const editingProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    phase: '',
    status: '',
    dueDate: format(new Date(), 'MMM d, yyyy'),
    icon: 'Folder',
    color: '#6366f1',
    teamIds: [users[0].id],
    tags: [] as string[]
  });

  const [newCustom, setNewCustom] = useState({ type: '', value: '' });

  // Initialize defaults or editing data when modal opens
  React.useEffect(() => {
    if (isProjectModalOpen) {
      if (editingProject) {
        setFormData({
          name: editingProject.name,
          description: editingProject.description,
          category: editingProject.category,
          phase: editingProject.phase,
          status: editingProject.status,
          dueDate: editingProject.dueDate,
          icon: editingProject.icon,
          color: editingProject.color,
          teamIds: editingProject.team.map(u => u.id),
          tags: editingProject.tags
        });
      } else {
        setFormData({
          name: '',
          description: '',
          category: orgSettings.categories[0] || 'Design',
          phase: orgSettings.phases[0] || 'Discovery',
          status: orgSettings.statuses[0] || 'Active',
          dueDate: format(new Date(), 'MMM d, yyyy'),
          icon: 'Folder',
          color: '#6366f1',
          teamIds: [users[0].id],
          tags: []
        });
      }
    }
  }, [isProjectModalOpen, editingProject, orgSettings]);

  const handleAddCustom = (type: 'category' | 'phase' | 'status') => {
    if (!newCustom.value.trim()) return;
    if (type === 'category') {
      addOrgCategory(newCustom.value);
      setFormData({ ...formData, category: newCustom.value });
    } else if (type === 'phase') {
      addOrgPhase(newCustom.value);
      setFormData({ ...formData, phase: newCustom.value });
    } else {
      addOrgStatus(newCustom.value);
      setFormData({ ...formData, status: newCustom.value });
    }
    setNewCustom({ type: '', value: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const team = users.filter(u => formData.teamIds.includes(u.id));
    
    if (editingProject) {
      updateProject(editingProject.id, {
        name: formData.name,
        description: formData.description,
        notes: formData.description,
        category: formData.category,
        phase: formData.phase,
        status: formData.status as any,
        dueDate: formData.dueDate,
        icon: formData.icon,
        color: formData.color,
        team,
        tags: formData.tags
      });
    } else {
      addProject({
        name: formData.name,
        description: formData.description,
        notes: formData.description,
        category: formData.category,
        phase: formData.phase,
        status: formData.status as any,
        dueDate: formData.dueDate,
        icon: formData.icon,
        color: formData.color,
        team,
        tags: formData.tags,
        progress: 0,
        tasks: 0,
        attachments: []
      });
    }

    setProjectModalOpen(false);
  };

  if (!isProjectModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setProjectModalOpen(false)}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{editingProject ? 'Modify your project settings' : 'Set up your next big goal'}</p>
              </div>
              <button 
                onClick={() => setProjectModalOpen(false)}
                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
              >
                <Icons.Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Project Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Phoenix Redesign"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-container/10 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  placeholder="Describe the main objectives of this project..."
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-container/10 outline-none transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Project Color</label>
                <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  {[
                    '#3b82f6', '#6366f1', '#a855f7', '#ec4899', 
                    '#ef4444', '#f97316', '#f59e0b', '#10b981', 
                    '#14b8a6', '#06b6d4', '#64748b'
                  ].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={cn(
                        "h-8 w-8 rounded-full transition-all active:scale-90 relative",
                        formData.color === c ? "ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-primary-container/40" : "hover:scale-110"
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {formData.color === c && (
                        <Icons.Check className="h-4 w-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </button>
                  ))}
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-900 overflow-hidden relative">
                      <input 
                        type="color" 
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="absolute inset-[-10px] w-[50px] h-[50px] border-none p-0 cursor-pointer bg-transparent"
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{formData.color}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tags</label>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  {formData.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-md">
                      {tag}
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, idx) => idx !== i) })}
                        className="hover:text-indigo-700"
                      >
                        <Icons.Plus className="h-3 w-3 rotate-45" />
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text"
                    placeholder="Add tag..."
                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white w-24"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !formData.tags.includes(val)) {
                          setFormData({ ...formData, tags: [...formData.tags, val] });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                  <div className="space-y-2">
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary-container/20"
                    >
                      {orgSettings.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="ADD_NEW">+ Add New...</option>
                    </select>
                    {formData.category === 'ADD_NEW' && (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Name..."
                          value={newCustom.type === 'category' ? newCustom.value : ''}
                          onChange={(e) => setNewCustom({ type: 'category', value: e.target.value })}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-[10px] font-bold focus:ring-2 focus:ring-primary-container/20 outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => handleAddCustom('category')}
                          className="px-2 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Phase</label>
                  <div className="space-y-2">
                    <select
                      value={formData.phase}
                      onChange={e => setFormData({ ...formData, phase: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary-container/20"
                    >
                      {orgSettings.phases.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="ADD_NEW">+ Add New...</option>
                    </select>
                    {formData.phase === 'ADD_NEW' && (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Name..."
                          value={newCustom.type === 'phase' ? newCustom.value : ''}
                          onChange={(e) => setNewCustom({ type: 'phase', value: e.target.value })}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-[10px] font-bold focus:ring-2 focus:ring-primary-container/20 outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => handleAddCustom('phase')}
                          className="px-2 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <div className="space-y-2">
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary-container/20"
                    >
                      {orgSettings.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="ADD_NEW">+ Add New...</option>
                    </select>
                    {formData.status === 'ADD_NEW' && (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Name..."
                          value={newCustom.type === 'status' ? newCustom.value : ''}
                          onChange={(e) => setNewCustom({ type: 'status', value: e.target.value })}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-[10px] font-bold focus:ring-2 focus:ring-primary-container/20 outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => handleAddCustom('status')}
                          className="px-2 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Due Date</label>
                <div className="relative">
                  <Icons.Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <DatePicker
                    selected={formData.dueDate && isValid(parse(formData.dueDate, 'MMM d, yyyy', new Date())) ? parse(formData.dueDate, 'MMM d, yyyy', new Date()) : new Date()}
                    onChange={(date) => {
                      if (date) {
                        setFormData({ ...formData, dueDate: format(date, 'MMM d, yyyy') });
                      }
                    }}
                    dateFormat="MMM d, yyyy"
                    portalId="root-portal"
                    customInput={
                      <input
                        type="text"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-5 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-container/10 outline-none transition-all cursor-pointer"
                      />
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Team Members</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  {users.map(u => {
                    const isSelected = formData.teamIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData({ ...formData, teamIds: formData.teamIds.filter(id => id !== u.id) });
                          } else {
                            setFormData({ ...formData, teamIds: [...formData.teamIds, u.id] });
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 p-1 pr-3 rounded-full border transition-all",
                          isSelected 
                            ? "bg-primary-container text-white border-primary-container" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <img src={u.avatar} className="h-6 w-6 rounded-full" alt="" />
                        <span className="text-[10px] font-bold">{u.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-primary-container text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
