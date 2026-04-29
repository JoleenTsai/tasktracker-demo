import React, { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { Icons, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { EngagementStatus, Priority, EngagementCadence, User, Engagement } from '../types';
import { users } from '../constants';

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
    return url;
  }
  return `https://${url}`;
};

export const EngagementsView = () => {
  const { 
    engagements, 
    updateEngagementStatus, 
    addEngagement, 
    updateEngagement, 
    deleteEngagement, 
    toggleEngagementTask,
    tasks,
    addTask,
    openTaskDetails,
    addEngagementAttachment,
    removeEngagementAttachment
  } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEngagement, setEditingEngagement] = useState<Engagement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStatus, setNewStatus] = useState<EngagementStatus>('Upcoming');
  const [newPriority, setNewPriority] = useState<Priority>('Medium');
  const [newCadence, setNewCadence] = useState<EngagementCadence>('One-time');
  const [newPattern, setNewPattern] = useState('');
  const [newContactId, setNewContactId] = useState(users[1].id);
  const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<string[]>([]);
  const [newTasks, setNewTasks] = useState<{ id: string; title: string; completed: boolean; linkedTaskId?: string }[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isLinkingTask, setIsLinkingTask] = useState(false);

  // Attachment state
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState<'doc' | 'link'>('link');
  const [newAttachments, setNewAttachments] = useState<{ id: string; name: string; url: string; type: 'doc' | 'link' }[]>([]);

  // Calculate dynamic recurrence patterns based on newDate
  const getRecurrenceOptions = () => {
    if (!newDate) return ['Weekly', 'Bi-weekly', 'Monthly', 'Custom'];
    
    const [year, month, day] = newDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = date.getDate();
    const nth = Math.ceil(dayNum / 7);
    const ordinal = ['1st', '2nd', '3rd', '4th', '5th'][nth - 1];

    return [
      `Weekly on ${dayName}s`,
      `Bi-weekly on ${dayName}s`,
      `Monthly on the ${ordinal} ${dayName}`,
      `Monthly (Every ${dayNum}th)`,
      'Custom'
    ];
  };

  const recurrenceOptions = getRecurrenceOptions();

  // Update pattern when date changes or options change
  React.useEffect(() => {
    if (newCadence === 'Recurring' && !newPattern) {
      setNewPattern(recurrenceOptions[0]);
    }
  }, [newDate, newCadence]);

  const statusColors = {
    Active: "bg-primary-container/10 text-primary-container border-primary-container/20",
    'On Hold': "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Completed: "bg-green-500/10 text-green-500 border-green-500/20",
    Upcoming: "bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10",
    Cancelled: "bg-error/10 text-error border-error/20"
  };

  const handleAddEngagement = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = users.find(u => u.id === newContactId) || users[1];
    const stakeholders = users.filter(u => selectedStakeholderIds.includes(u.id));
    
    const engagementData = {
      title: newTitle,
      description: newDescription,
      engagementDate: newDate || 'Pending',
      status: newStatus,
      priority: newPriority,
      cadence: newCadence,
      recurrencePattern: newCadence === 'Recurring' ? newPattern : undefined,
      stakeholders: stakeholders,
      clientContact: contact,
      accountLead: users[0], // Current User
      tasks: newTasks.map(t => ({ 
        id: t.id, 
        title: t.title, 
        completed: t.completed,
        assignees: [],
        linkedTaskId: t.linkedTaskId
      })),
      attachments: newAttachments.map(a => ({
        id: a.id,
        name: a.name,
        url: a.url,
        type: a.type,
        createdAt: new Date().toLocaleDateString()
      }))
    };

    if (editingEngagement) {
      updateEngagement(editingEngagement.id, engagementData);
    } else {
      addEngagement(engagementData);
    }
    
    setIsModalOpen(false);
    setEditingEngagement(null);
    resetForm();
  };

  const openEditModal = (engagement: Engagement) => {
    setEditingEngagement(engagement);
    setNewTitle(engagement.title);
    setNewDescription(engagement.description || '');
    setNewDate(engagement.engagementDate === 'Pending' ? '' : engagement.engagementDate);
    setNewStatus(engagement.status);
    setNewPriority(engagement.priority);
    setNewCadence(engagement.cadence);
    setNewPattern(engagement.recurrencePattern || '');
    setNewContactId(engagement.clientContact.id);
    setSelectedStakeholderIds(engagement.stakeholders.map(u => u.id));
    setNewTasks(engagement.tasks?.map(t => ({ 
      id: t.id, 
      title: t.title, 
      completed: t.completed,
      linkedTaskId: t.linkedTaskId 
    })) || []);
    setNewAttachments(engagement.attachments?.map(a => ({
      id: a.id,
      name: a.name,
      url: a.url,
      type: a.type as 'doc' | 'link' // Casting for simplicity in the form
    })) || []);
    setIsModalOpen(true);
  };

  const toggleStakeholder = (userId: string) => {
    setSelectedStakeholderIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewDate('');
    setNewStatus('Upcoming');
    setNewPriority('Medium');
    setNewCadence('One-time');
    setNewPattern('Weekly on Thursdays');
    setSelectedStakeholderIds([]);
    setNewTasks([]);
    setNewAttachments([]);
    setIsLinkingTask(false);
  };

  const addAttachmentToEngagement = () => {
    if (!attachmentName.trim() || !attachmentUrl.trim()) return;
    setNewAttachments(prev => [...prev, {
      id: `att-${Date.now()}`,
      name: attachmentName.trim(),
      url: attachmentUrl.trim(),
      type: attachmentType
    }]);
    setAttachmentName('');
    setAttachmentUrl('');
  };

  const removeAttachmentFromEngagement = (id: string) => {
    setNewAttachments(prev => prev.filter(a => a.id !== id));
  };

  const addTaskToEngagement = () => {
    if (!newTaskInput.trim()) return;
    setNewTasks(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      title: newTaskInput.trim(), 
      completed: false 
    }]);
    setNewTaskInput('');
  };

  const linkExistingTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setNewTasks(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      title: task.title, 
      completed: task.status === 'Completed',
      linkedTaskId: task.id
    }]);
    setIsLinkingTask(false);
  };

  const promoteToWorkspaceTask = (engagementTaskId: string) => {
    const taskData = newTasks.find(t => t.id === engagementTaskId);
    if (!taskData || taskData.linkedTaskId) return;

    // Create a new task in the workspace
    const newWorkspaceTask = {
      title: taskData.title,
      description: `Action item from engagement: ${newTitle}`,
      project: 'Internal Management',
      priority: newPriority,
      status: 'To Do',
      assignees: [users[0]], // Default to current user
      reporter: users[0],
      dueDate: newDate || 'No Due Date',
      tags: ['engagement-action'],
      subtasks: [],
      attachments: [],
    };

    // This is a bit tricky since addTask in context usually handles the id generation
    // and returns nothing. We'll rely on the title for identifying it or assume the next state has it.
    // However, for immediate linking, we should ideally have the new ID.
    // For now, I'll just trigger the add and let the user know.
    addTask(newWorkspaceTask);
    
    // We update the local state to indicate it's pending link (UI hint)
    setNewTasks(prev => prev.map(t => t.id === engagementTaskId ? { ...t, linkedTaskId: 'PENDING' } : t));
  };

  const removeTaskFromEngagement = (id: string) => {
    setNewTasks(prev => prev.filter(t => t.id !== id));
  };

  const filteredEngagements = engagements.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.clientContact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-container mb-2">
            <Icons.Boards className="w-5 h-5" />
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em]">Account Management</h1>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Engagement <span className="text-primary-container">Tracker</span>
          </h2>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-8 py-4 bg-primary-container text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-container/25 hover:scale-105 active:scale-95 transition-all"
        >
          <Icons.Plus className="w-4 h-4" />
          Create Engagement
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-container transition-colors" />
          <input 
            type="text"
            placeholder="Search engagements, clients, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 pl-11 pr-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-none transition-all placeholder:text-slate-400 placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEngagements.map((engagement, index) => (
          <motion.div
            key={engagement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-container/10 rounded-2xl">
                  <Icons.Boards className="w-5 h-5 text-primary-container" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Engagement</p>
                  <p className="text-[10px] font-black text-primary-container uppercase tracking-widest">#{engagement.id.slice(0, 6)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <select 
                  value={engagement.status}
                  onChange={(e) => updateEngagementStatus(engagement.id, e.target.value as EngagementStatus)}
                  className={cn(
                    "text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-tighter outline-none cursor-pointer appearance-none text-center",
                    statusColors[engagement.status as keyof typeof statusColors]
                  )}
                >
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <span className={cn(
                  "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                  engagement.priority === 'Urgent' ? "bg-error text-white" : "text-slate-400 bg-slate-50 dark:bg-white/5"
                )}>
                  {engagement.priority}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-primary-container transition-colors mb-2">
                  {engagement.title}
                </h4>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative">
                    <img 
                      src={engagement.clientContact.avatar} 
                      className="h-7 w-7 rounded-lg border-2 border-white dark:border-slate-800 shadow-lg" 
                      alt="" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900shadow-sm" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {engagement.clientContact.name}
                    </h5>
                    <p className="text-[8px] font-black text-primary-container uppercase tracking-widest">
                      {engagement.clientContact.role}
                    </p>
                  </div>
                </div>

                {engagement.cadence === 'Recurring' && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="p-1 px-2 bg-primary-container/10 text-primary-container rounded-lg">
                      <Icons.RefreshCw className="w-3 h-3 animate-spin-slow" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-primary-container tracking-widest">{engagement.recurrencePattern}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                {engagement.description}
              </p>
            </div>

            {engagement.tasks && engagement.tasks.length > 0 && (
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Action Items</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-primary-container">
                    {engagement.tasks.filter(t => t.completed).length}/{engagement.tasks.length} Complete
                  </p>
                </div>
                <div className="space-y-1.5 uppercase">
                  {engagement.tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleEngagementTask(engagement.id, task.id)}
                        className={cn(
                          "flex-1 flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
                          task.completed 
                            ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800" 
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary-container/30"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                          task.completed ? "bg-primary-container border-primary-container" : "border-slate-200 dark:border-slate-700"
                        )}>
                          {task.completed && <Icons.Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold tracking-tight transition-all",
                          task.completed ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"
                        )}>
                          {task.title}
                        </span>
                      </button>
                      {task.linkedTaskId && (
                        <button 
                          onClick={() => task.linkedTaskId && openTaskDetails(task.linkedTaskId)}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-primary-container hover:bg-primary-container hover:text-white transition-all shadow-sm"
                          title="View Workspace Task"
                        >
                          <Icons.ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {engagement.attachments && engagement.attachments.length > 0 && (
              <div className="mb-6">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Resources & Docs</p>
                <div className="flex flex-wrap gap-2">
                  {engagement.attachments.map(att => (
                    <a 
                      key={att.id}
                      href={ensureAbsoluteUrl(att.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary-container transition-all"
                    >
                      {att.type === 'doc' ? <Icons.Folder className="w-3 h-3 text-primary-container" /> : <Icons.ExternalLink className="w-3 h-3 text-primary-container" />}
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{att.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {engagement.stakeholders && engagement.stakeholders.length > 0 && (
              <div className="mb-8">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Stakeholders</p>
                <div className="flex -space-x-2">
                  {engagement.stakeholders.map(stakeholder => (
                    <img 
                      key={stakeholder.id}
                      src={stakeholder.avatar}
                      alt={stakeholder.name}
                      title={stakeholder.name}
                      className="w-6 h-6 rounded-lg border-2 border-white dark:border-slate-900 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-8 border-t border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <Icons.Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Date</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200">{engagement.engagementDate}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => openEditModal(engagement)}
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Engagement"
                >
                  <Icons.Pencil className="w-4 h-4 text-slate-400 hover:text-primary-container" />
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Delete this engagement?')) {
                      deleteEngagement(engagement.id);
                    }
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete Engagement"
                >
                   <Icons.Trash2 className="w-4 h-4 text-slate-400 hover:text-error" />
                </button>
              </div>
            </div>
            
            <div className="absolute top-[-2rem] right-[-2rem] w-32 h-32 bg-primary-container/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
                <header className="mb-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-container mb-2">Internal Management</h3>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">
                      {editingEngagement ? 'Update' : 'New'} Account <span className="text-primary-container">Engagement</span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <Icons.Plus className="w-6 h-6 rotate-45 text-slate-400" />
                  </button>
                </header>

                <form onSubmit={handleAddEngagement} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Engagement Title</label>
                      <input 
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g., Annual Account Review Q4"
                        className="w-full bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Client Contact</label>
                        <select 
                          value={newContactId}
                          onChange={(e) => setNewContactId(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 transition-all font-black text-[10px] uppercase tracking-wider"
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Target Date</label>
                        <input 
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 transition-all font-black text-[10px] uppercase tracking-wider"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Cadence</label>
                        <select 
                          value={newCadence}
                          onChange={(e) => setNewCadence(e.target.value as EngagementCadence)}
                          className="w-full bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 transition-all font-black text-[10px] uppercase tracking-wider"
                        >
                          <option value="One-time">One-time</option>
                          <option value="Recurring">Recurring</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Priority</label>
                        <select 
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value as Priority)}
                          className="w-full bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 transition-all font-black text-[10px] uppercase tracking-wider"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {newCadence === 'Recurring' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Recurrence Plan</label>
                          <select 
                            value={newPattern === 'Custom' ? 'Custom' : recurrenceOptions.includes(newPattern) ? newPattern : 'Custom'}
                            onChange={(e) => setNewPattern(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 transition-all font-black text-[10px] uppercase tracking-wider"
                          >
                            {recurrenceOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>

                        {(!recurrenceOptions.includes(newPattern) || newPattern === 'Custom') && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="space-y-2"
                          >
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Custom Cadence Description</label>
                            <input 
                              value={newPattern === 'Custom' ? '' : newPattern}
                              onChange={(e) => setNewPattern(e.target.value)}
                              placeholder="e.g., Every 10th of the month"
                              className="w-full bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 transition-all font-bold text-xs"
                            />
                          </motion.div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Internal Stakeholders</label>
                      <div className="flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        {users.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleStakeholder(u.id)}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-xl border transition-all",
                              selectedStakeholderIds.includes(u.id)
                                ? "bg-primary-container text-white border-primary-container"
                                : "bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800"
                            )}
                          >
                            <img src={u.avatar} className="w-5 h-5 rounded-md" alt="" />
                            <span className="text-[9px] font-black uppercase tracking-tight">{u.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Engagement scope / notes</label>
                      <textarea 
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={4}
                        placeholder="Define the primary objectives of this engagement..."
                        className="w-full bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all resize-none text-[12px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-8 flex flex-col">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between ml-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Items & Tasks</label>
                        <button 
                          type="button"
                          onClick={() => setIsLinkingTask(!isLinkingTask)}
                          className={cn(
                            "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border transition-all",
                            isLinkingTask 
                              ? "bg-primary-container text-white border-primary-container" 
                              : "text-slate-400 border-slate-100 dark:border-slate-800 hover:text-primary-container hover:border-primary-container/30"
                          )}
                        >
                          {isLinkingTask ? 'Cancel Link' : 'Link Existing Task'}
                        </button>
                      </div>

                      {isLinkingTask ? (
                        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-primary-container/30 p-6 space-y-4 animate-in fade-in zoom-in-95">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Search Workspace Tasks</p>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {tasks.filter(t => !newTasks.find(nt => nt.linkedTaskId === t.id)).length > 0 ? (
                              tasks
                                .filter(t => !newTasks.find(nt => nt.linkedTaskId === t.id))
                                .map(task => (
                                <button
                                  key={task.id}
                                  type="button"
                                  onClick={() => linkExistingTask(task.id)}
                                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary-container transition-all text-left group"
                                >
                                  <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight group-hover:text-primary-container transition-colors">{task.title}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{task.project}</p>
                                  </div>
                                  <Icons.Plus className="w-4 h-4 text-slate-300 group-hover:text-primary-container" />
                                </button>
                              ))
                            ) : (
                              <p className="text-center py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">No linkable tasks found</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input 
                            value={newTaskInput}
                            onChange={(e) => setNewTaskInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTaskToEngagement())}
                            placeholder="Add a required action..."
                            className="flex-1 bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 transition-all uppercase text-[10px] font-black tracking-widest"
                          />
                          <button 
                            type="button"
                            onClick={addTaskToEngagement}
                            className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 hover:bg-primary-container hover:text-white transition-all shadow-lg shadow-slate-200/50 dark:shadow-none"
                          >
                            <Icons.Plus className="w-5 h-5 text-slate-400 group-hover:text-white" />
                          </button>
                        </div>
                      )}

                      <div className="space-y-3 mt-6">
                        {newTasks.map(task => (
                          <div 
                            key={task.id}
                            className={cn(
                              "flex items-center justify-between p-5 rounded-[1.5rem] border transition-all group",
                              task.linkedTaskId ? "bg-primary-container/5 border-primary-container/10" : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-50 dark:border-slate-800"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "p-2 rounded-xl",
                                task.completed ? "bg-green-500/10 text-green-500" : "bg-primary-container/10 text-primary-container"
                              )}>
                                <Icons.Check className="w-4 h-4" />
                              </div>
                              <div>
                                <span className={cn(
                                  "text-[11px] font-black dark:text-slate-200 uppercase tracking-tight",
                                  task.completed ? "text-slate-400 line-through" : "text-slate-700"
                                )}>
                                  {task.title}
                                </span>
                                {task.linkedTaskId && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Icons.ExternalLink className="w-2.5 h-2.5 text-primary-container" />
                                    <span className="text-[8px] font-black text-primary-container uppercase tracking-widest">
                                      {task.linkedTaskId === 'PENDING' ? 'Workspace Task Created' : 'Linked to Workspace Task'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!task.linkedTaskId && (
                                <button
                                  type="button"
                                  onClick={() => promoteToWorkspaceTask(task.id)}
                                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary-container hover:border-primary-container transition-all group-hover:opacity-100 sm:opacity-0"
                                  title="Create as Workspace Task"
                                >
                                  <Icons.TrendingUp className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button 
                                type="button"
                                onClick={() => removeTaskFromEngagement(task.id)}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-error hover:border-error transition-all group-hover:opacity-100 sm:opacity-0"
                                title="Remove Action Item"
                              >
                                <Icons.Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Documents & Links</label>
                      <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            value={attachmentName}
                            onChange={(e) => setAttachmentName(e.target.value)}
                            placeholder="Resource Name..."
                            className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 text-[10px] font-bold uppercase tracking-widest"
                          />
                          <div className="flex gap-2">
                            <select 
                              value={attachmentType}
                              onChange={(e) => setAttachmentType(e.target.value as 'doc' | 'link')}
                              className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 text-[9px] font-black uppercase tracking-tighter"
                            >
                              <option value="link">Link</option>
                              <option value="doc">Document</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            value={attachmentUrl}
                            onChange={(e) => setAttachmentUrl(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 text-[10px] font-medium"
                          />
                          <button 
                            type="button"
                            onClick={addAttachmentToEngagement}
                            className="p-3 px-5 bg-primary-container text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            Add
                          </button>
                        </div>

                        <div className="space-y-2 pt-2">
                          {newAttachments.map(att => (
                            <div key={att.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 group">
                              <div className="flex items-center gap-3">
                                {att.type === 'doc' ? <Icons.Folder className="w-3.5 h-3.5 text-primary-container" /> : <Icons.ExternalLink className="w-3.5 h-3.5 text-primary-container" />}
                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{att.name}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeAttachmentFromEngagement(att.id)}
                                className="p-1 px-2 text-slate-300 hover:text-error transition-all"
                              >
                                <Icons.Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-10 mt-auto">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setEditingEngagement(null);
                          resetForm();
                        }}
                        className="flex-1 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-8 py-5 bg-primary-container text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-container/25 hover:brightness-110 active:scale-[0.98] transition-all"
                      >
                        {editingEngagement ? 'Update Registry' : 'Initialize Tracker'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
