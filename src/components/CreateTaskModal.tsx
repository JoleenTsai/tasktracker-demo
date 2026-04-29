import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { MagicImportModal } from './MagicImportModal';
import { users, mockProjects } from '../constants';
import { Attachment, Subtask, Priority } from '../types';
import DatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';

export const CreateTaskModal = () => {
  const { isTaskModalOpen, setTaskModalOpen, addTask, user } = useTasks();
  const [isMagicImportOpen, setIsMagicImportOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: mockProjects[0].name,
    priority: 'Medium' as Priority,
    status: 'Backlog' as const,
    assigneeIds: [] as string[],
    dueDate: format(new Date(), 'MMM d, yyyy'),
    points: 5,
    tags: []
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, assigneeIds: [user.id] }));
    }
  }, [user]);


  const [attachments, setAttachments] = useState<Omit<Attachment, 'id'>[]>([]);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [tempAttachment, setTempAttachment] = useState({ name: '', url: '', type: 'doc' as const });

  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [subtaskAssigneeSearch, setSubtaskAssigneeSearch] = useState('');

  const [subtasks, setSubtasks] = useState<Omit<Subtask, 'id'>[]>([]);

  // Automatically assign points based on priority and subtasks
  useEffect(() => {
    const priorityPoints: Record<Priority, number> = {
      'Urgent': 13,
      'High': 8,
      'Medium': 5,
      'Low': 3
    };
    const basePoints = priorityPoints[formData.priority] || 5;
    const subtaskPoints = subtasks.length * 2;
    setFormData(prev => ({ 
      ...prev, 
      points: basePoints + subtaskPoints 
    }));
  }, [formData.priority, subtasks.length]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [tempSubtask, setTempSubtask] = useState<{
    title: string;
    assigneeIds: string[];
    dueDate: string;
    completed: boolean;
  }>({ 
    title: '', 
    assigneeIds: [], 
    dueDate: '',
    completed: false 
  });

  const addAttachment = () => {
    if (!tempAttachment.name || !tempAttachment.url) return;
    setAttachments([...attachments, { ...tempAttachment }]);
    setTempAttachment({ name: '', url: '', type: 'doc' });
    setShowAttachmentForm(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const addSubtask = () => {
    if (!tempSubtask.title) return;
    const assignees = users.filter(u => tempSubtask.assigneeIds.includes(u.id));
    setSubtasks([...subtasks, { 
      title: tempSubtask.title, 
      assignees, 
      dueDate: tempSubtask.dueDate || undefined,
      completed: false 
    }]);
    setTempSubtask({ title: '', assigneeIds: [], dueDate: '', completed: false });
    setShowSubtaskForm(false);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignees = users.filter(u => formData.assigneeIds.includes(u.id));
    if (assignees.length === 0) assignees.push(users[0]);
    
    addTask({
      title: formData.title,
      description: formData.description,
      project: formData.project,
      priority: formData.priority as any,
      status: formData.status as any,
      assignees,
      reporter: user, // Current user
      dueDate: formData.dueDate, 
      points: formData.points,
      tags: formData.tags,
      attachments: attachments.map((a, i) => ({ ...a, id: `att-${Date.now()}-${i}` })),
      subtasks: subtasks.map((s, i) => ({ ...s, id: `st-${Date.now()}-${i}` }))
    });
    
    setFormData({
      title: '',
      description: '',
      project: mockProjects[0].name,
      priority: 'Medium',
      status: 'Backlog',
      assigneeIds: [user.id],
      dueDate: format(new Date(), 'MMM d, yyyy'),
      points: 5,
      tags: []
    });
    setAttachments([]);
    setSubtasks([]);
    setTaskModalOpen(false);
  };

  if (!isTaskModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setTaskModalOpen(false)}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full md:w-[75vw] max-w-6xl bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Create New Task</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Fill in the details for your new task</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsMagicImportOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-container/10 text-primary-container rounded-xl hover:bg-primary-container hover:text-white transition-all group"
                  title="Import from Doc with AI"
                >
                  <Icons.Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest pointer-events-none">Magic Import</span>
                </button>
                <button 
                  onClick={() => setTaskModalOpen(false)}
                  className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                >
                  <Icons.Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Task Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Design new authentication flow"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-container/10 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  placeholder="Add more details about this task..."
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-container/10 outline-none transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Project</label>
                      <select
                        value={formData.project}
                        onChange={e => setFormData({ ...formData, project: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        {mockProjects.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assignees</label>
                    <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[50px]">
                      <div className="relative mb-2">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Filter users..."
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary-container/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {users.filter(u => u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || formData.assigneeIds.includes(u.id)).map(u => {
                          const isSelected = formData.assigneeIds.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({ ...formData, assigneeIds: formData.assigneeIds.filter(id => id !== u.id) });
                                } else {
                                  setFormData({ ...formData, assigneeIds: [...formData.assigneeIds, u.id] });
                                }
                              }}
                              className={cn(
                                "flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all",
                                isSelected 
                                  ? "bg-primary-container text-white border-primary-container" 
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                              )}
                            >
                              <img src={u.avatar} className="h-5 w-5 rounded-full" alt="" />
                              <span className="text-[10px] font-bold">{u.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Backlog">Backlog</option>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="In Review">In Review</option>
                        <option value="Completed">Completed</option>
                      </select>
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

              <div className="space-y-4">
                 <div className="flex items-center justify-between ml-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtasks</label>
                   <button 
                    type="button"
                    onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                    className="text-[10px] font-black text-primary-container uppercase tracking-widest hover:underline"
                   >
                     {showSubtaskForm ? 'Cancel' : '+ Add Subtask'}
                   </button>
                 </div>

                 <AnimatePresence>
                   {showSubtaskForm && (
                     <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 overflow-hidden"
                     >
                        <div className="space-y-2">
                          <input 
                            placeholder="Subtask Title"
                            value={tempSubtask.title}
                            onChange={e => setTempSubtask({ ...tempSubtask, title: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-3 p-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignees</label>
                          <div className="relative mb-1">
                            <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search..."
                              value={subtaskAssigneeSearch}
                              onChange={(e) => setSubtaskAssigneeSearch(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1 text-[9px] font-bold outline-none focus:ring-1 focus:ring-primary-container/20"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {users.filter(u => u.name.toLowerCase().includes(subtaskAssigneeSearch.toLowerCase()) || tempSubtask.assigneeIds.includes(u.id)).map(u => {
                              const isSelected = tempSubtask.assigneeIds.includes(u.id);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setTempSubtask({ ...tempSubtask, assigneeIds: tempSubtask.assigneeIds.filter(id => id !== u.id) });
                                    } else {
                                      setTempSubtask({ ...tempSubtask, assigneeIds: [...tempSubtask.assigneeIds, u.id] });
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-1.5 p-1 pr-2 rounded-full border transition-all",
                                    isSelected 
                                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white" 
                                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                  )}
                                >
                                  <img src={u.avatar} className="h-4 w-4 rounded-full" alt="" />
                                  <span className="text-[9px] font-bold">{u.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="relative">
                          <Icons.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                          <DatePicker
                            selected={tempSubtask.dueDate && isValid(parse(tempSubtask.dueDate, 'MMM d, yyyy', new Date())) ? parse(tempSubtask.dueDate, 'MMM d, yyyy', new Date()) : null}
                            onChange={(date) => {
                              if (date) {
                                setTempSubtask({ ...tempSubtask, dueDate: format(date, 'MMM d, yyyy') });
                              }
                            }}
                            dateFormat="MMM d, yyyy"
                            placeholderText="Due Date (optional)"
                            portalId="root-portal"
                            customInput={
                              <input 
                                type="text"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none"
                              />
                            }
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={addSubtask}
                          className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          <Icons.Plus className="h-3 w-3" />
                          Add Subtask
                        </button>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <Reorder.Group axis="y" values={subtasks} onReorder={setSubtasks} className="space-y-2">
                   {subtasks.map((st, i) => (
                     <Reorder.Item 
                       key={st.title + i} 
                       value={st}
                       className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl group cursor-grab active:cursor-grabbing"
                     >
                       <div className="flex items-center gap-3">
                         <Icons.Grip className="h-4 w-4 text-slate-300 dark:text-slate-700 group-hover:text-slate-400 transition-colors" />
                         <div className="h-6 w-6 rounded bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                           <div className="w-3 h-3 rounded-sm border-2 border-slate-300 dark:border-slate-600" />
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{st.title}</span>
                           <div className="flex items-center gap-2">
                             {st.assignees && st.assignees.length > 0 && (
                               <div className="flex -space-x-1">
                                 {st.assignees.map((u, k) => (
                                   <img key={k} src={u.avatar} className="h-3 w-3 rounded-full border border-white dark:border-slate-800" title={u.name} alt={u.name} />
                                 ))}
                               </div>
                             )}
                             {st.dueDate && (
                               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                 <Icons.Calendar className="h-2.5 w-2.5" />
                                 {st.dueDate}
                               </span>
                             )}
                           </div>
                         </div>
                       </div>
                       
                       <button 
                         type="button"
                         onClick={() => removeSubtask(i)}
                         className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                       >
                         <Icons.Plus className="h-3 w-3 rotate-45" />
                       </button>
                     </Reorder.Item>
                   ))}
                   {subtasks.length === 0 && !showSubtaskForm && (
                     <p className="text-[10px] text-slate-400 text-center py-2 font-bold uppercase tracking-widest">No subtasks added yet</p>
                   )}
                 </Reorder.Group>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between ml-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Links & Attachments</label>
                   <button 
                    type="button"
                    onClick={() => setShowAttachmentForm(!showAttachmentForm)}
                    className="text-[10px] font-black text-primary-container uppercase tracking-widest hover:underline"
                   >
                     {showAttachmentForm ? 'Cancel' : '+ Add Link'}
                   </button>
                 </div>

                 <AnimatePresence>
                   {showAttachmentForm && (
                     <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 overflow-hidden"
                     >
                       <div className="grid grid-cols-2 gap-3">
                          <input 
                            placeholder="Name (e.g. Design Spec)"
                            value={tempAttachment.name}
                            onChange={e => setTempAttachment({ ...tempAttachment, name: e.target.value })}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                          />
                          <select 
                            value={tempAttachment.type}
                            onChange={e => setTempAttachment({ ...tempAttachment, type: e.target.value as any })}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                          >
                            <option value="doc">Google Drive Link</option>
                            <option value="pdf">PDF Documentation</option>
                            <option value="image">Screenshot/Image</option>
                          </select>
                       </div>
                       <div className="flex gap-3">
                          <input 
                            placeholder="URL (https://...)"
                            value={tempAttachment.url}
                            onChange={e => setTempAttachment({ ...tempAttachment, url: e.target.value })}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                          />
                          <button 
                            type="button"
                            onClick={addAttachment}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            Add
                          </button>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="space-y-2">
                   {attachments.map((att, i) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                       <div className="flex items-center gap-3">
                         <div className={cn(
                           "p-2 rounded-lg",
                           att.type === 'image' ? "bg-emerald-50 text-emerald-500" :
                           att.type === 'pdf' ? "bg-rose-50 text-rose-500" :
                           "bg-indigo-50 text-indigo-500"
                         )}>
                           {att.type === 'image' ? <Icons.Image className="h-3 w-3" /> : <Icons.File className="h-3 w-3" />}
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{att.name}</span>
                           <span className="text-[8px] font-bold text-slate-400 truncate max-w-[200px]">{att.url}</span>
                         </div>
                       </div>
                       <button 
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                       >
                         <Icons.Plus className="h-3 w-3 rotate-45" />
                       </button>
                     </div>
                   ))}
                   {attachments.length === 0 && !showAttachmentForm && (
                     <p className="text-[10px] text-slate-400 text-center py-2 font-bold uppercase tracking-widest">No links attached yet</p>
                   )}
                 </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 ml-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Story Points</label>
                  <div className="group relative">
                    <Icons.Help className="h-3 w-3 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-[9px] font-bold text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700">
                      <p className="uppercase tracking-widest mb-1 text-primary-container">Points Formula:</p>
                      <ul className="space-y-1 text-slate-300">
                        <li>• Priority Base (Urgent: 13, High: 8, Medium: 5, Low: 3)</li>
                        <li>• +2 points per subtask</li>
                        <li>• Editable for custom complexity</li>
                      </ul>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:ring-4 focus:ring-primary-container/10"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTaskModalOpen(false);
                    setAttachments([]);
                    setSubtasks([]);
                    setShowAttachmentForm(false);
                    setShowSubtaskForm(false);
                  }}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-primary-container text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <MagicImportModal 
        isOpen={isMagicImportOpen} 
        onClose={() => setIsMagicImportOpen(false)} 
      />
    </AnimatePresence>
  );
};
