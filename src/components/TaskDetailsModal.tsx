import React from 'react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { users } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import DatePicker from 'react-datepicker';
import { parse, format, isValid } from 'date-fns';

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
    return url;
  }
  return `https://${url}`;
};

export const TaskDetailsModal = () => {
  const { 
    isTaskDetailsOpen, 
    setTaskDetailsOpen, 
    selectedTaskId, 
    tasks, 
    updateTaskStatus, 
    updateTask,
    deleteTask,
    addTaskComment,
    getTaskValue,
    getEffectiveStatus,
    user
  } = useTasks();
  const [isEditing, setIsEditing] = React.useState(false);
  const canEdit = user.role !== 'Viewer';
  const [assigneeSearch, setAssigneeSearch] = React.useState('');
  const [newSubtask, setNewSubtask] = React.useState({ title: '', description: '', dueDate: '', assignees: [] });
  const [editingSubtaskId, setEditingSubtaskId] = React.useState<string | null>(null);
  const [newLink, setNewLink] = React.useState({ name: '', url: '', type: 'link' });
  
  const task = tasks.find(t => t.id === selectedTaskId);
  const [editData, setEditData] = React.useState<any>(null);

  React.useEffect(() => {
    if (task) {
      setEditData({ 
        ...task,
        status: getTaskValue(task, 'status'),
        title: getTaskValue(task, 'title'),
        priority: getTaskValue(task, 'priority'),
        dueDate: getTaskValue(task, 'dueDate'),
      });
    }
  }, [task, isTaskDetailsOpen]); // Re-sync when modal opens

  if (!task || !editData) return null;

  const handleSave = () => {
    updateTask(task.id, editData);
    setIsEditing(false);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleMarkComplete = () => {
    updateTaskStatus(task.id, 'Completed');
  };

  const priorityOptions = ["Low", "Medium", "High", "Urgent"];

  const priorityColors = {
    Urgent: "bg-error/10 text-error border-error/20",
    High: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Medium: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    Low: "bg-slate-500/10 text-slate-500 border-slate-500/20"
  };

  return (
    <AnimatePresence>
      {isTaskDetailsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTaskDetailsOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full md:w-[75vw] max-w-6xl bg-white dark:bg-slate-950 shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 pointer-events-auto max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-container text-white flex items-center justify-center font-black text-xs">
                  {task.id.split('-')[1]}
                </div>
                <div>
                  {isEditing ? (
                    <input 
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase bg-transparent border-b-2 border-primary-container outline-none w-full"
                    />
                  ) : (
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{getTaskValue(task, 'title')}</h2>
                  )}
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{task.project}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && getEffectiveStatus(task) !== 'Completed' && canEdit && (
                  <button 
                    onClick={handleMarkComplete}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Icons.Check className="h-3 w-3" />
                    Complete Task
                  </button>
                )}
                {isEditing ? (
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-primary-container text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary-container/20 transition-all"
                  >
                    <Icons.Check className="h-3 w-3" />
                    Save Changes
                  </button>
                ) : (
                  canEdit && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      <Icons.Settings className="h-3 w-3" />
                      Edit Task
                    </button>
                  )
                )}
                {canEdit && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Delete this task?')) deleteTask(task.id);
                    }}
                    className="p-3 text-slate-400 hover:text-error transition-all relative z-10"
                    title="Delete Task"
                  >
                    <Icons.Delete className="h-5 w-5" />
                  </button>
                )}
                <button 
                  onClick={() => setTaskDetailsOpen(false)}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                >
                  <Icons.Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Core Info */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value={isEditing ? editData.status : getEffectiveStatus(task)}
                    disabled={!canEdit && !isEditing}
                    onChange={(e) => {
                      if (isEditing) {
                        setEditData({ ...editData, status: e.target.value as any });
                      } else {
                        updateTaskStatus(task.id, e.target.value as any);
                      }
                    }}
                    className={cn(
                      "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-container/10 transition-all cursor-pointer",
                      !canEdit && !isEditing && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                  {isEditing ? (
                      <select 
                        value={editData.priority}
                        onChange={(e) => {
                          const newPriority = e.target.value;
                          const pointsMap: Record<string, number> = {
                            'Urgent': 13,
                            'High': 8,
                            'Medium': 5,
                            'Low': 3
                          };
                          setEditData({ 
                            ...editData, 
                            priority: newPriority,
                            points: pointsMap[newPriority] || editData.points
                          });
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-container/10 transition-all cursor-pointer"
                      >
                      {priorityOptions.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  ) : (
                    <div className={cn(
                      "w-full rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest border flex items-center gap-2",
                      priorityColors[getTaskValue(task, 'priority') as keyof typeof priorityColors]
                    )}>
                      <div className="h-2 w-2 rounded-full bg-current" />
                      {getTaskValue(task, 'priority')}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Story Points</label>
                  {isEditing ? (
                    <input 
                      type="number"
                      min="0"
                      value={editData.points}
                      onChange={(e) => setEditData({ ...editData, points: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-container/10 transition-all"
                    />
                  ) : (
                    <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Icons.Boards className="h-3 w-3" />
                      {getTaskValue(task, 'points')} Points
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags</label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/60 min-h-[56px]">
                  {(isEditing ? editData.tags : task.tags).map((tag: string, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/10">
                      {tag}
                      {isEditing && (
                        <button 
                          type="button"
                          onClick={() => setEditData({ ...editData, tags: editData.tags.filter((_: any, idx: number) => idx !== i) })}
                          className="hover:text-indigo-700 transition-colors"
                        >
                          <Icons.Plus className="h-3 w-3 rotate-45" />
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditing && (
                    <input 
                      type="text"
                      placeholder="+ Add tag..."
                      className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white w-24 placeholder:text-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val && !editData.tags.includes(val)) {
                            setEditData({ ...editData, tags: [...editData.tags, val] });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  )}
                  {(!isEditing && task.tags.length === 0) && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No tags</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                {isEditing ? (
                  <textarea 
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={4}
                    className="w-full p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-primary-container/10 transition-all text-sm text-slate-600 dark:text-slate-400 font-medium resize-none"
                  />
                ) : (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/60 leading-relaxed text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap">
                    {task.description}
                  </div>
                )}
              </div>

              {/* Subtasks */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Subtasks {isEditing ? `(${editData.subtasks.length})` : `(${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length})`}
                </label>
                
                <div className="space-y-2">
                  {(isEditing ? editData.subtasks : task.subtasks).map((st: any, idx: number) => {
                    const isBeingEdited = isEditing && editingSubtaskId === st.id;
                    
                    return (
                      <div key={st.id} className={cn(
                        "flex flex-col p-4 bg-white dark:bg-white/[0.02] border transition-all",
                        isBeingEdited ? "border-primary-container ring-1 ring-primary-container/20 rounded-3xl" : "border-slate-100 dark:border-slate-800 rounded-2xl"
                      )}>
                        <div className="flex items-center gap-4">
                          {!isEditing && (
                            <button 
                              onClick={() => handleToggleSubtask(st.id)}
                              className={cn(
                                "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                st.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-200 dark:border-slate-700 hover:border-emerald-500/50"
                              )}
                            >
                              {st.completed && <Icons.Check className="h-3.5 w-3.5 text-white" />}
                            </button>
                          )}

                          <div className="flex-1">
                            {isBeingEdited ? (
                              <div className="relative group/input">
                                <input 
                                  value={st.title}
                                  onChange={(e) => {
                                    const updated = [...editData.subtasks];
                                    updated[idx] = { ...updated[idx], title: e.target.value };
                                    setEditData({ ...editData, subtasks: updated });
                                  }}
                                  placeholder="Subtask title..."
                                  autoFocus
                                  className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 outline-none w-full text-xs font-bold uppercase tracking-tight text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                  <p className={cn(
                                    "text-xs font-bold uppercase tracking-tight",
                                    st.completed ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"
                                  )}>{st.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {st.description && (
                                      <p className="text-[9px] font-medium text-slate-500 line-clamp-1 max-w-[150px]">{st.description}</p>
                                    )}
                                    {st.dueDate && (
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                        {st.dueDate}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {st.assignees && st.assignees.length > 0 && (
                                    <div className="flex -space-x-1.5">
                                      {st.assignees.map((u: any, k: number) => (
                                        <img key={k} src={u.avatar} className="h-5 w-5 rounded-full border border-white dark:border-slate-900 shadow-sm" title={u.name} alt={u.name} />
                                      ))}
                                    </div>
                                  )}
                                  {isEditing && (
                                    <button 
                                      onClick={() => setEditingSubtaskId(st.id)}
                                      className="p-1.5 rounded bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-primary-container hover:bg-primary-container/10 transition-all border border-slate-100 dark:border-slate-800"
                                      title="Edit Subtask"
                                    >
                                      <Icons.Edit className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {isEditing && !isBeingEdited && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  if (confirm('Delete this subtask?')) {
                                    const updated = editData.subtasks.filter((_: any, i: number) => i !== idx);
                                    setEditData({ ...editData, subtasks: updated });
                                  }
                                }}
                                className="p-1.5 hover:bg-error/10 hover:text-error rounded-lg transition-colors text-slate-300"
                                title="Delete Subtask"
                              >
                                <Icons.Delete className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Subtask Details Editing */}
                        {isBeingEdited && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4"
                          >
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                              <textarea 
                                value={st.description || ''}
                                onChange={(e) => {
                                  const updated = [...editData.subtasks];
                                  updated[idx] = { ...updated[idx], description: e.target.value };
                                  setEditData({ ...editData, subtasks: updated });
                                }}
                                placeholder="Add more details about this subtask..."
                                rows={2}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-[11px] font-medium text-slate-600 dark:text-slate-400 resize-none"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1 space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due Date</label>
                                <DatePicker
                                  selected={st.dueDate && isValid(parse(st.dueDate, 'MMM d, yyyy', new Date())) ? parse(st.dueDate, 'MMM d, yyyy', new Date()) : null}
                                  onChange={(date) => {
                                    if (date) {
                                      const updated = [...editData.subtasks];
                                      updated[idx] = { ...updated[idx], dueDate: format(date, 'MMM d, yyyy') };
                                      setEditData({ ...editData, subtasks: updated });
                                    }
                                  }}
                                  onClickOutside={(e) => e.stopPropagation()}
                                  customInput={
                                    <div className="relative group/date">
                                      <Icons.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within/date:text-primary-container transition-colors" />
                                      <input 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold outline-none cursor-pointer focus:border-primary-container transition-all"
                                        readOnly
                                      />
                                    </div>
                                  }
                                  dateFormat="MMM d, yyyy"
                                  portalId="root-portal"
                                />
                              </div>
                              <div className="flex-[2] space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assignees</label>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {users.map(u => {
                                    const isSelected = (st.assignees || []).some((au: any) => au.id === u.id);
                                    return (
                                      <button
                                        key={u.id}
                                        onClick={() => {
                                          const updatedSubtasks = [...editData.subtasks];
                                          const currentAssignees = st.assignees || [];
                                          if (isSelected) {
                                            updatedSubtasks[idx] = { 
                                              ...st, 
                                              assignees: currentAssignees.filter((au: any) => au.id !== u.id) 
                                            };
                                          } else {
                                            updatedSubtasks[idx] = { 
                                              ...st, 
                                              assignees: [...currentAssignees, u] 
                                            };
                                          }
                                          setEditData({ ...editData, subtasks: updatedSubtasks });
                                        }}
                                      className={cn(
                                        "h-7 w-7 rounded-full border-2 transition-all overflow-hidden relative group/avatar",
                                        isSelected ? "border-primary-container ring-4 ring-primary-container/10 z-10 scale-110" : "border-transparent opacity-70 hover:opacity-100 hover:scale-110"
                                      )}
                                        title={u.name}
                                      >
                                        <img src={u.avatar} className="h-full w-full object-cover" />
                                        {isSelected && (
                                          <div className="absolute inset-0 bg-primary-container/20 flex items-center justify-center">
                                            <Icons.Check className="h-3 w-3 text-white" />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}

                  {isEditing && (
                    <div className="flex flex-col gap-3 p-5 bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl transition-all hover:border-primary-container/30">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-primary-container shadow-sm">
                          <Icons.Plus className="h-4 w-4" />
                        </div>
                        <input 
                          value={newSubtask.title}
                          onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                          placeholder="Type new subtask tile..."
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-primary-container/5 transition-all"
                        />
                      </div>
                      
                      {newSubtask.title.trim() && (
                        <div className="pl-11 space-y-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                            <textarea 
                              value={newSubtask.description}
                              onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                              placeholder="Add description (optional)..."
                              rows={2}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[11px] resize-none outline-none focus:ring-4 focus:ring-primary-container/5 transition-all"
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due Date</label>
                              <DatePicker
                                selected={newSubtask.dueDate ? parse(newSubtask.dueDate, 'MMM d, yyyy', new Date()) : null}
                                onChange={(date) => {
                                  if (date) {
                                    setNewSubtask({ ...newSubtask, dueDate: format(date, 'MMM d, yyyy') });
                                  }
                                }}
                                onClickOutside={(e) => e.stopPropagation()}
                                customInput={
                                  <div className="relative group/date">
                                    <Icons.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within/date:text-primary-container transition-colors" />
                                    <input 
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold outline-none cursor-pointer focus:border-primary-container transition-all"
                                      placeholder="Select date"
                                      readOnly
                                    />
                                  </div>
                                }
                                dateFormat="MMM d, yyyy"
                                portalId="root-portal"
                              />
                            </div>
                            <div className="flex-[2] space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assignees</label>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {users.map(u => {
                                  const isSelected = newSubtask.assignees.some((au: any) => au.id === u.id);
                                  return (
                                    <button
                                      key={u.id}
                                      onClick={() => {
                                        if (isSelected) {
                                          setNewSubtask({ ...newSubtask, assignees: newSubtask.assignees.filter((au: any) => au.id !== u.id) });
                                        } else {
                                          setNewSubtask({ ...newSubtask, assignees: [...newSubtask.assignees, u] });
                                        }
                                      }}
                                      className={cn(
                                        "h-7 w-7 rounded-full border-2 transition-all overflow-hidden relative group/avatar",
                                        isSelected ? "border-primary-container ring-4 ring-primary-container/10 z-10 scale-110" : "border-transparent opacity-70 hover:opacity-100 hover:scale-110"
                                      )}
                                      title={u.name}
                                    >
                                      <img src={u.avatar} className="h-full w-full object-cover" />
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-primary-container/20 flex items-center justify-center">
                                          <Icons.Check className="h-3 w-3 text-white" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => {
                                setEditData({
                                  ...editData,
                                  subtasks: [...editData.subtasks, {
                                    id: Math.random().toString(36).substr(2, 9),
                                    ...newSubtask,
                                    completed: false
                                  }]
                                });
                                setNewSubtask({ title: '', description: '', dueDate: '', assignees: [] });
                              }}
                              className="px-6 py-2 bg-primary-container text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              Create Subtask
                            </button>
                            <button 
                              onClick={() => setNewSubtask({ title: '', description: '', dueDate: '', assignees: [] })}
                              className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Links & Attachments</label>
                <div className="grid grid-cols-1 gap-2">
                  {(isEditing ? editData.attachments : task.attachments).map((att: any, idx: number) => (
                    <div key={att.id} className="flex items-center gap-2">
                      <a 
                        href={ensureAbsoluteUrl(att.url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary-container transition-colors">
                            {att.type === 'doc' ? <Icons.FileText className="h-4 w-4" /> : <Icons.Link className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-container">{att.name}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{att.type}</p>
                          </div>
                        </div>
                        <Icons.Expand className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                      </a>
                      
                      {isEditing && (
                        <button 
                          onClick={() => {
                            const updated = editData.attachments.filter((_: any, i: number) => i !== idx);
                            setEditData({ ...editData, attachments: updated });
                          }}
                          className="p-4 hover:bg-error/10 hover:text-error border border-slate-100 dark:border-slate-800 rounded-2xl transition-colors text-slate-300 shadow-sm"
                        >
                          <Icons.Plus className="h-4 w-4 rotate-45" />
                        </button>
                      )}
                    </div>
                  ))}

                  {isEditing && (
                    <div className="space-y-2 p-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <div className="flex gap-2">
                        <input 
                          placeholder="Link Name (e.g. Figma Design)"
                          value={newLink.name}
                          onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                        />
                        <input 
                          placeholder="URL (https://...)"
                          value={newLink.url}
                          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                          className="flex-[2] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                        />
                        <button 
                          onClick={() => {
                            if (newLink.name && newLink.url) {
                              setEditData({
                                ...editData,
                                attachments: [...editData.attachments, {
                                  ...newLink,
                                  id: Math.random().toString(36).substr(2, 9),
                                  type: 'link'
                                }]
                              });
                              setNewLink({ name: '', url: '', type: 'link' });
                            }
                          }}
                          className="px-4 py-1.5 bg-primary-container text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                          disabled={!newLink.name || !newLink.url}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments/Activity Entry */}
                  <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comments</label>
                <div className="flex gap-4 items-start p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-slate-800 rounded-3xl group-focus-within:border-primary-container/30 transition-all">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center font-black text-[10px] uppercase text-slate-500 overflow-hidden">
                    <img src={user.avatar} className="h-full w-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea 
                      placeholder="Add a comment or update..."
                      id="activity-comment-input"
                      rows={2}
                      className="w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white font-medium resize-none placeholder:text-slate-400 pt-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            addTaskComment(task.id, val);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <>
                            <button className="p-1.5 text-slate-400 hover:text-primary-container hover:bg-primary-container/5 rounded-lg transition-all">
                              <Icons.Link className="h-3.5 w-3.5" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-primary-container hover:bg-primary-container/5 rounded-lg transition-all">
                              <Icons.More className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          const input = document.getElementById('activity-comment-input') as HTMLTextAreaElement;
                          const val = input?.value.trim();
                          if (val) {
                            addTaskComment(task.id, val);
                            input.value = '';
                          }
                        }}
                        className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                      >
                        Post update
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Timeline</label>
                <div className="space-y-6 relative ml-4">
                  <div className="absolute left-[-17px] top-2 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800/60" />
                  {(task.activity || []).slice().sort((a, b) => {
                    if (b.createdAt && a.createdAt) return b.createdAt - a.createdAt;
                    return b.id.localeCompare(a.id);
                  }).map((act) => {
                    let activityContent;
                    let activityIcon = <div className="absolute left-[-22px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 bg-primary-container z-10 shadow-sm" />;
                    
                    if (act.type === 'status_change') {
                      activityContent = (
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                          <span className="font-black text-slate-900 dark:text-white uppercase">{act.user.name}</span>
                          {" changed status from "}
                          <span className="text-slate-400 line-through decoration-slate-300">{act.oldValue}</span>
                          {" to "}
                          <span className="font-black text-primary-container uppercase">{act.newValue}</span>
                        </p>
                      );
                    } else if (act.type === 'priority_change') {
                      activityContent = (
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                          <span className="font-black text-slate-900 dark:text-white uppercase">{act.user.name}</span>
                          {" updated priority from "}
                          <span className="text-slate-400 font-bold">{act.oldValue}</span>
                          {" to "}
                          <span className="font-black text-amber-500 uppercase">{act.newValue}</span>
                        </p>
                      );
                      activityIcon = <div className="absolute left-[-22px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 bg-amber-500 z-10 shadow-sm" />;
                    } else if (act.type === 'comment') {
                      activityContent = (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                            <span className="font-black text-slate-900 dark:text-white uppercase">{act.user.name}</span>
                            {" commented"}
                          </p>
                          <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 italic text-[11px] text-slate-600 dark:text-slate-400">
                            "{act.content}"
                          </div>
                        </div>
                      );
                      activityIcon = <div className="absolute left-[-22px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 bg-indigo-500 z-10 shadow-sm" />;
                    }

                    return (
                      <div key={act.id} className="relative flex items-start gap-4">
                        {activityIcon}
                        <div className="flex-1">
                          {activityContent}
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{act.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Action bar when editing */}
            <AnimatePresence>
              {isEditing && (
                <motion.div 
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  exit={{ y: 100 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white dark:bg-slate-900 p-2 pl-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl min-w-[320px]"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-auto">Unsaved Changes</span>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this task?')) {
                        deleteTask(task.id);
                      }
                    }}
                    className="p-2 text-error hover:bg-error/5 rounded-xl transition-all relative z-10"
                    title="Delete Task"
                  >
                    <Icons.Delete className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ ...task });
                    }}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-primary-container text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary-container/20 active:scale-95 transition-all shadow-md"
                  >
                    <Icons.Check className="h-3.5 w-3.5" />
                    Save Task
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-6">
              {isEditing && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignees</label>
                  <div className="space-y-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                    <div className="relative mb-2">
                      <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search team members..."
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-container/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {users.filter(u => u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || editData.assignees.some((au: any) => au.id === u.id)).map(u => {
                        const isSelected = editData.assignees.some((au: any) => au.id === u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setEditData({ ...editData, assignees: editData.assignees.filter((au: any) => au.id !== u.id) });
                              } else {
                                setEditData({ ...editData, assignees: [...editData.assignees, u] });
                              }
                            }}
                            className={cn(
                              "flex items-center gap-1.5 p-1 pr-3 rounded-full border transition-all",
                              isSelected 
                                ? "bg-primary-container text-white border-primary-container" 
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                            )}
                          >
                            <img src={u.avatar} className="h-5 w-5 rounded-full" alt="" />
                            <span className="text-[9px] font-bold">{u.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {task.assignees.map((user, i) => (
                      <img key={i} src={user.avatar} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" title={user.name} alt={user.name} />
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Assigned to</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {task.assignees.length === 1 ? task.assignees[0].name : `${task.assignees.length} Members`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Due Date</p>
                    {isEditing ? (
                      <DatePicker
                        selected={editData.dueDate && isValid(parse(editData.dueDate, 'MMM d, yyyy', new Date())) ? parse(editData.dueDate, 'MMM d, yyyy', new Date()) : null}
                        onChange={(date) => {
                          if (date) {
                            setEditData({ ...editData, dueDate: format(date, 'MMM d, yyyy') });
                          }
                        }}
                        customInput={
                          <input 
                            type="text"
                            className="bg-transparent text-[10px] text-slate-500 font-bold uppercase tracking-widest outline-none cursor-pointer w-32 text-right focus:text-primary-container"
                          />
                        }
                        dateFormat="MMM d, yyyy"
                        portalId="root-portal"
                      />
                    ) : (
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{getTaskValue(task, 'dueDate')}</p>
                    )}
                  </div>
                  <Icons.Calendar className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
