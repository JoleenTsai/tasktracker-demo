import React from 'react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { users } from '../constants';
import { FilterDropdown } from './FilterDropdown';
import { motion, AnimatePresence } from 'motion/react';
import DatePicker from 'react-datepicker';
import { parse, format, isValid } from 'date-fns';

export const TasksList = () => {
  const { 
    tasks, 
    setTaskModalOpen, 
    openTaskDetails, 
    deleteTask, 
    updateTask,
    pendingUpdates,
    setPendingUpdates,
    getEffectiveStatus,
    getTaskValue,
    filteredTasks,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    searchQuery,
    setSearchQuery,
    assigneeFilter,
    setAssigneeFilter,
    projectFilter,
    setProjectFilter,
    projects,
    taskViewMode,
    setTaskViewMode,
    user
  } = useTasks();
  const canEdit = user.role !== 'Viewer';
  const [activeMetric, setActiveMetric] = React.useState<string | null>(null);
  const [editingCell, setEditingCell] = React.useState<{ taskId: string, field: string } | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');

  const handleSave = (taskId: string, field: string, value: any) => {
    if (!canEdit) return;
    setPendingUpdates(prev => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        [field]: value
      }
    }));
    setEditingCell(null);
  };

  const handleBulkSave = (type: 'active' | 'backlog' | 'completed') => {
    const tasksForSection = tasks.filter(t => {
      const status = getEffectiveStatus(t);
      if (type === 'active') return status !== 'Backlog' && status !== 'Completed';
      if (type === 'backlog') return status === 'Backlog';
      return status === 'Completed';
    });

    tasksForSection.forEach(task => {
      const updates = pendingUpdates[task.id];
      if (updates) {
        updateTask(task.id, updates);
      }
    });
  };

  const handleDiscard = (type: 'active' | 'backlog' | 'completed') => {
    const tasksForSection = tasks.filter(t => {
      const status = getEffectiveStatus(t);
      if (type === 'active') return status !== 'Backlog' && status !== 'Completed';
      if (type === 'backlog') return status === 'Backlog';
      return status === 'Completed';
    });

    setPendingUpdates(prev => {
      const next = { ...prev };
      tasksForSection.forEach(task => delete next[task.id]);
      return next;
    });
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const activeCount = tasks.filter(t => t.status === 'In Progress').length;
  const blockedCount = tasks.filter(t => t.status === 'Blocked').length;
  const reviewCount = tasks.filter(t => t.status === 'In Review').length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  const activeTasks = filteredTasks.filter(t => {
    const status = getEffectiveStatus(t);
    return status !== 'Backlog' && status !== 'Completed';
  });
  const backlogTasks = filteredTasks.filter(t => getEffectiveStatus(t) === 'Backlog');
  const finishedTasks = filteredTasks.filter(t => getEffectiveStatus(t) === 'Completed');
  
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());

  const getPendingCount = (type: 'active' | 'backlog' | 'completed') => {
    return tasks.filter(t => {
      const hasPending = !!pendingUpdates[t.id];
      if (!hasPending) return false;
      const status = getEffectiveStatus(t);
      if (type === 'active') return status !== 'Backlog' && status !== 'Completed';
      if (type === 'backlog') return status === 'Backlog';
      return status === 'Completed';
    }).length;
  };

  const toggleExpand = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };
  
  const TaskRow = ({ task, index }: any) => {
    return (
      <React.Fragment key={task.id}>
        <motion.tr
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => openTaskDetails(task.id)}
          className={cn(
            "hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer relative",
            expandedTasks.has(task.id) && "bg-slate-50 dark:bg-white/[0.01]"
          )}
        >
          <td className="px-6 py-4 relative">
            {projects.find(p => p.name === task.project)?.color && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1" 
                style={{ backgroundColor: projects.find(p => p.name === task.project)?.color }} 
              />
            )}
            <div className="flex items-center gap-3">
              {task.subtasks.length > 0 && (
                <button 
                  onClick={(e) => toggleExpand(e, task.id)}
                  className={cn(
                    "p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-all",
                    expandedTasks.has(task.id) && "rotate-90 text-primary-container"
                  )}
                >
                  <Icons.ChevronDown className="h-3 w-3" />
                </button>
              )}
              <div className="flex flex-col">
                {editingCell?.taskId === task.id && editingCell?.field === 'title' ? (
                  <div className="relative flex items-center gap-2 group/edit" onClick={(e) => e.stopPropagation()}>
                    <input 
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(task.id, 'title', editValue);
                        if (e.key === 'Escape') handleCancel();
                      }}
                      onBlur={() => handleSave(task.id, 'title', editValue)}
                      className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-1 text-sm font-bold w-full uppercase tracking-tight focus:ring-2 focus:ring-primary-container outline-none"
                    />
                  </div>
                ) : (
                  <span 
                    onClick={(e) => {
                      if (!canEdit) return;
                      e.stopPropagation();
                      setEditingCell({ taskId: task.id, field: 'title' });
                      setEditValue(getTaskValue(task, 'title'));
                    }}
                    className={cn(
                      "text-sm font-bold transition-colors uppercase tracking-tight cursor-text hover:bg-slate-100 dark:hover:bg-white/5 px-1 rounded",
                      pendingUpdates[task.id]?.title ? "text-primary-container italic" : "text-slate-900 dark:text-white group-hover:text-primary-container",
                      !canEdit && "cursor-default"
                    )}
                  >
                    {getTaskValue(task, 'title')}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest">{task.project}</span>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            {editingCell?.taskId === task.id && editingCell?.field === 'priority' ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <select 
                  autoFocus
                  value={editValue}
                  onChange={(e) => handleSave(task.id, 'priority', e.target.value)}
                  onBlur={handleCancel}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary-container outline-none"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            ) : (
              <span 
                onClick={(e) => {
                  if (!canEdit) return;
                  e.stopPropagation();
                  setEditingCell({ taskId: task.id, field: 'priority' });
                  setEditValue(getTaskValue(task, 'priority'));
                }}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border cursor-pointer hover:brightness-90 transition-all",
                  pendingUpdates[task.id]?.priority && "ring-2 ring-primary-container/20 border-primary-container",
                  getTaskValue(task, 'priority') === 'Urgent' ? "bg-error/10 text-error border-error/20" : 
                  getTaskValue(task, 'priority') === 'High' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
                  !canEdit && "cursor-default brightness-100 hover:brightness-100"
                )}
              >
                {getTaskValue(task, 'priority')}
              </span>
            )}
          </td>
          <td className="px-6 py-4">
            {editingCell?.taskId === task.id && editingCell?.field === 'dueDate' ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <DatePicker
                  selected={editValue && isValid(parse(editValue, 'MMM d, yyyy', new Date())) ? parse(editValue, 'MMM d, yyyy', new Date()) : null}
                  onChange={(date) => {
                    if (date) {
                      handleSave(task.id, 'dueDate', format(date, 'MMM d, yyyy'));
                    }
                  }}
                  onBlur={handleCancel}
                  autoFocus
                  open
                  customInput={
                    <input 
                      className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-0.5 text-[11px] font-bold w-32 focus:ring-2 focus:ring-primary-container outline-none"
                      readOnly
                    />
                  }
                  dateFormat="MMM d, yyyy"
                  portalId="root-portal"
                />
              </div>
            ) : (
              <span 
                onClick={(e) => {
                  if (!canEdit) return;
                  e.stopPropagation();
                  setEditingCell({ taskId: task.id, field: 'dueDate' });
                  setEditValue(getTaskValue(task, 'dueDate'));
                }}
                className={cn(
                  "font-bold text-[11px] cursor-text hover:bg-slate-100 dark:hover:bg-white/5 px-1 rounded",
                  pendingUpdates[task.id]?.dueDate ? "text-primary-container italic" : "text-slate-600 dark:text-slate-400",
                  !canEdit && "cursor-default"
                )}
              >
                {getTaskValue(task, 'dueDate')}
              </span>
            )}
          </td>
          <td className="px-6 py-4">
            <div className="flex -space-x-1.5">
              {task.assignees.map((user: any, j: number) => (
                <img key={j} src={user.avatar} className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-900" title={user.name} alt={user.name} />
              ))}
            </div>
          </td>
          <td className="px-6 py-4">
            {editingCell?.taskId === task.id && editingCell?.field === 'status' ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <select 
                  autoFocus
                  value={editValue}
                  onChange={(e) => handleSave(task.id, 'status', e.target.value)}
                  onBlur={handleCancel}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-tighter focus:ring-4 focus:ring-primary-container/10 outline-none"
                >
                  <option value="Done">Done</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                  <option value="Backlog">Backlog</option>
                </select>
              </div>
            ) : (
              <div 
                onClick={(e) => {
                  if (!canEdit) return;
                  e.stopPropagation();
                  setEditingCell({ taskId: task.id, field: 'status' });
                  setEditValue(getTaskValue(task, 'status'));
                }}
                className={cn(
                  "flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 px-1 rounded py-1 transition-colors",
                  pendingUpdates[task.id]?.status && "ring-1 ring-primary-container/20",
                  !canEdit && "cursor-default"
                )}
              >
                <div className={cn("h-1.5 w-1.5 rounded-full", getTaskValue(task, 'status') === 'Completed' ? "bg-emerald-500" : "bg-primary-container ring-4 ring-primary-container/10")} />
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-tighter",
                  pendingUpdates[task.id]?.status ? "text-primary-container" : "text-slate-700 dark:text-slate-300"
                )}>{getTaskValue(task, 'status')}</span>
              </div>
            )}
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end gap-1">
              {canEdit && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this task?')) {
                      deleteTask(task.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-error transition-all relative z-10"
                  title="Delete Task"
                >
                  <Icons.Delete className="h-4 w-4" />
                </button>
              )}
              <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2">
                <Icons.More className="h-4 w-4" />
              </button>
            </div>
          </td>
        </motion.tr>
        <AnimatePresence>
          {expandedTasks.has(task.id) && (
            <motion.tr
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50/30 dark:bg-white/[0.005]"
            >
              <td colSpan={6} className="px-12 py-3">
                <div className="space-y-2 border-l-2 border-slate-100 dark:border-slate-800/40 pl-6 my-2">
                  {task.subtasks.map((st: any) => (
                    <div key={st.id} className="flex items-center justify-between group/st hover:bg-slate-100/50 dark:hover:bg-white/[0.02] p-2 rounded-lg transition-all">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-all",
                          st.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-700"
                        )}>
                          {st.completed && <Icons.Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-tight transition-all",
                            st.completed ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"
                          )}>{st.title}</span>
                          {st.description && (
                            <span className="text-[8px] text-slate-400 line-clamp-1">{st.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {st.dueDate && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            <Icons.Calendar className="h-2 w-2" />
                            {st.dueDate}
                          </div>
                        )}
                        <div className="flex -space-x-1">
                          {st.assignees.map((u: any, k: number) => (
                            <img key={k} src={u.avatar} className="h-4 w-4 rounded-full border border-white dark:border-slate-900 shadow-sm" title={u.name} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </td>
            </motion.tr>
          )}
        </AnimatePresence>
      </React.Fragment>
    );
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tasks Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track and manage your team's deliverables in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setTaskViewMode('all')}
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                taskViewMode === 'all' 
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 transition-colors"
              )}
            >
              All
            </button>
            <button 
              onClick={() => setTaskViewMode('byProject')}
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                taskViewMode === 'byProject' 
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 transition-colors"
              )}
            >
              By Project
            </button>
          </div>
          {canEdit && (
            <button 
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-container text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Icons.Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard 
          title="Completed" 
          value={`${completionRate}%`} 
          icon="Tasks" 
          color="emerald" 
          onClick={() => setActiveMetric(activeMetric === 'completed' ? null : 'completed')}
          isActive={activeMetric === 'completed'}
        />
        <SummaryCard 
          title="Active" 
          value={activeCount.toString().padStart(2, '0')} 
          icon="Boards" 
          color="indigo" 
          onClick={() => setActiveMetric(activeMetric === 'active' ? null : 'active')}
          isActive={activeMetric === 'active'}
        />
        <SummaryCard 
          title="Blocked" 
          value={blockedCount.toString().padStart(2, '0')} 
          icon="Help" 
          color="error" 
          accent={blockedCount > 0}
          onClick={() => setActiveMetric(activeMetric === 'blocked' ? null : 'blocked')}
          isActive={activeMetric === 'blocked'}
        />
        <SummaryCard 
          title="In Review" 
          value={reviewCount.toString().padStart(2, '0')} 
          icon="Dashboard" 
          color="amber" 
          onClick={() => setActiveMetric(activeMetric === 'review' ? null : 'review')}
          isActive={activeMetric === 'review'}
        />
      </div>

      <AnimatePresence>
        {activeMetric && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl mb-6 shadow-sm"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  {activeMetric === 'completed' ? 'Recently Completed' : 
                   activeMetric === 'active' ? 'Currently Active' : 
                   activeMetric === 'blocked' ? 'Blocked Issues' : 'Awaiting Review'}
                </h3>
                <button 
                  onClick={() => setActiveMetric(null)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter(t => {
                    if (activeMetric === 'completed') return t.status === 'Completed';
                    if (activeMetric === 'active') return t.status === 'In Progress';
                    if (activeMetric === 'blocked') return t.status === 'Blocked';
                    if (activeMetric === 'review') return t.status === 'In Review';
                    return false;
                  })
                  .slice(0, 5)
                  .map(task => (
                    <div 
                      key={task.id}
                      onClick={() => openTaskDetails(task.id)}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-primary-container/30 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-primary-container transition-colors">{task.title}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{task.project}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1.5">
                          {task.assignees.map((user, j) => (
                            <img key={j} src={user.avatar} className="h-5 w-5 rounded-full border border-white dark:border-slate-900" alt={user.name} />
                          ))}
                        </div>
                        <Icons.ArrowRight className="h-3 w-3 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                {tasks.filter(t => {
                    if (activeMetric === 'completed') return t.status === 'Completed';
                    if (activeMetric === 'active') return t.status === 'In Progress';
                    if (activeMetric === 'blocked') return t.status === 'Blocked';
                    if (activeMetric === 'review') return t.status === 'In Review';
                    return false;
                  }).length === 0 && (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No tasks found in this category</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {taskViewMode === 'all' ? (
          <>
            <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-10">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white px-2">Active Tasks</h2>
              <div className="flex items-center gap-2">
                <FilterDropdown 
                  label="Status"
                  options={[
                    { value: 'To Do', label: 'To Do' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'In Review', label: 'In Review' },
                    { value: 'Blocked', label: 'Blocked' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Backlog', label: 'Backlog' }
                  ]}
                  selectedValues={statusFilter}
                  onChange={setStatusFilter}
                />

                <FilterDropdown 
                  label="Priority"
                  options={[
                    { value: 'Urgent', label: 'Urgent' },
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' }
                  ]}
                  selectedValues={priorityFilter}
                  onChange={setPriorityFilter}
                />

                <FilterDropdown 
                  label="Tag"
                  options={[
                    { value: 'engineering', label: 'Engineering' },
                    { value: 'design', label: 'Design' },
                    { value: 'marketing', label: 'Marketing' },
                    { value: 'infrastructure', label: 'Infrastructure' }
                  ]}
                  selectedValues={tagFilter}
                  onChange={setTagFilter}
                />

                <FilterDropdown 
                  label="Project"
                  options={projects.map(p => ({ 
                    value: p.name, 
                    label: p.name,
                    icon: <div className="h-4 w-4 flex items-center justify-center"><Icons.Folder className="h-3 w-3" /></div>
                  }))}
                  selectedValues={projectFilter}
                  onChange={setProjectFilter}
                />

                <FilterDropdown 
                  label="Assignee"
                  options={users.map(u => ({ 
                    value: u.id, 
                    label: u.name,
                    icon: <img src={u.avatar} className="h-4 w-4 rounded-full" alt="" />
                  }))}
                  selectedValues={assigneeFilter}
                  onChange={setAssigneeFilter}
                />

                {(statusFilter.length > 0 || priorityFilter.length > 0 || tagFilter.length > 0 || assigneeFilter.length > 0 || projectFilter.length > 0) && (
                  <button 
                    onClick={() => {
                      setStatusFilter([]);
                      setPriorityFilter([]);
                      setTagFilter([]);
                      setAssigneeFilter([]);
                      setProjectFilter([]);
                    }}
                    className="text-[9px] font-black text-error uppercase tracking-widest hover:underline ml-2"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Sort by:</span>
              <select className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white font-black cursor-pointer uppercase">
                <option>Due Date</option>
                <option>Priority</option>
              </select>
            </div>
          </div>

          <AnimatePresence>
            {getPendingCount('active') > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-primary-container/20 bg-primary-container/[0.03] dark:bg-primary-container/[0.05]"
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-container p-2 rounded-lg">
                      <Icons.Edit className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-container">Active Table Pending Changes</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{getPendingCount('active')} tasks modified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDiscard('active')}
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={() => handleBulkSave('active')}
                      className="px-6 py-2 bg-primary-container text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                      Save Active Table
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Task Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Due Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assignees</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {activeTasks.map((task, i) => (
                  <TaskRow key={task.id} task={task} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {backlogTasks.length > 0 && (
          <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icons.Folder className="h-3.5 w-3.5 text-slate-400" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Backlog Space</h2>
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-black text-slate-500">{backlogTasks.length}</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {getPendingCount('backlog') > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-primary-container/20 bg-primary-container/[0.03]"
                >
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icons.Edit className="h-3.5 w-3.5 text-primary-container" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        <span className="text-primary-container">{getPendingCount('backlog')} backlog items modified</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDiscard('backlog')}
                        className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={() => handleBulkSave('backlog')}
                        className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:brightness-110 transition-all"
                      >
                        Save Backlog
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {backlogTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => openTaskDetails(task.id)}
                  className="px-6 py-3 hover:bg-white dark:hover:bg-slate-900/40 transition-colors group cursor-pointer flex items-center justify-between relative"
                >
                  {projects.find(p => p.name === task.project)?.color && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1" 
                      style={{ backgroundColor: projects.find(p => p.name === task.project)?.color }} 
                    />
                  )}
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary-container transition-colors uppercase tracking-tight">{getTaskValue(task, 'title')}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest">{task.project}</span>
                    </div>
                  </div>
                    <div className="flex items-center gap-6">
                      {editingCell?.taskId === task.id && editingCell?.field === 'status' ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <select 
                            autoFocus
                            value={editValue}
                            onChange={(e) => handleSave(task.id, 'status', e.target.value)}
                            onBlur={handleCancel}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary-container outline-none"
                          >
                            <option value="Backlog">Backlog</option>
                            <option value="Done">Done</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Review">In Review</option>
                            <option value="Blocked">Blocked</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      ) : (
                        <span 
                          onClick={(e) => {
                            if (!canEdit) return;
                            e.stopPropagation();
                            setEditingCell({ taskId: task.id, field: 'status' });
                            setEditValue(getTaskValue(task, 'status'));
                          }}
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded transition-all cursor-pointer border",
                            pendingUpdates[task.id]?.status 
                              ? "text-primary-container border-primary-container bg-primary-container/5 italic" 
                              : "text-slate-400 border-transparent hover:text-primary-container hover:bg-primary-container/10 hover:border-primary-container/20",
                            !canEdit && "cursor-default hover:text-slate-400 hover:bg-transparent hover:border-transparent"
                          )}
                        >
                          {getTaskValue(task, 'status')}
                        </span>
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{getTaskValue(task, 'priority')}</span>
                    <div className="flex -space-x-1">
                      {task.assignees.map((user, j) => (
                        <img key={j} src={user.avatar} className="h-5 w-5 rounded-full border border-slate-50 dark:border-slate-900" alt={user.name} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this task?')) deleteTask(task.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-error transition-all relative z-10"
                          title="Delete Task"
                        >
                          <Icons.Delete className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Icons.ArrowRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {finishedTasks.length > 0 && (
          <div className="bg-emerald-50/[0.3] dark:bg-emerald-950/[0.05] rounded-2xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/[0.5] dark:bg-emerald-950/[0.1]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icons.CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Completed Space</h2>
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-[9px] font-black text-emerald-600">{finishedTasks.length}</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {getPendingCount('completed') > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-emerald-200 dark:border-emerald-800 bg-emerald-50/50"
                >
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icons.Edit className="h-3.5 w-3.5 text-emerald-600" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                        <span>{getPendingCount('completed')} completed items modified</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDiscard('completed')}
                        className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-600 transition-colors"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={() => handleBulkSave('completed')}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:brightness-110 transition-all"
                      >
                        Save Completed
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="divide-y divide-emerald-100/50 dark:divide-emerald-900/20">
              {finishedTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => openTaskDetails(task.id)}
                  className="px-6 py-3 hover:bg-white dark:hover:bg-slate-900/40 transition-colors group cursor-pointer flex items-center justify-between relative"
                >
                  {projects.find(p => p.name === task.project)?.color && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1" 
                      style={{ backgroundColor: projects.find(p => p.name === task.project)?.color }} 
                    />
                  )}
                  <div className="flex items-center gap-4">
                    <Icons.Check className="h-3 w-3 text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 transition-colors uppercase tracking-tight line-through opacity-60">{getTaskValue(task, 'title')}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest">{task.project}</span>
                    </div>
                  </div>
                    <div className="flex items-center gap-6">
                      {editingCell?.taskId === task.id && editingCell?.field === 'status' ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <select 
                            autoFocus
                            value={editValue}
                            onChange={(e) => handleSave(task.id, 'status', e.target.value)}
                            onBlur={handleCancel}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="Completed">Completed</option>
                            <option value="Backlog">Backlog</option>
                            <option value="Done">Done</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Review">In Review</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                        </div>
                      ) : (
                        <span 
                          onClick={(e) => {
                            if (!canEdit) return;
                            e.stopPropagation();
                            setEditingCell({ taskId: task.id, field: 'status' });
                            setEditValue(getTaskValue(task, 'status'));
                          }}
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded transition-all cursor-pointer border",
                            pendingUpdates[task.id]?.status 
                              ? "text-emerald-600 border-emerald-500 bg-emerald-50 italic" 
                              : "text-emerald-500/60 border-transparent hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200",
                            !canEdit && "cursor-default hover:text-emerald-500/60 hover:bg-transparent hover:border-transparent"
                          )}
                        >
                          {getTaskValue(task, 'status')}
                        </span>
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{getTaskValue(task, 'priority')}</span>
                    <div className="flex -space-x-1 opacity-50">
                      {task.assignees.map((user, j) => (
                        <img key={j} src={user.avatar} className="h-5 w-5 rounded-full border border-slate-50 dark:border-slate-900" alt={user.name} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this task?')) deleteTask(task.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-error transition-all relative z-10"
                          title="Delete Task"
                        >
                          <Icons.Delete className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Icons.ArrowRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
        ) : (
          <div className="space-y-8">
            {projects.map(project => {
              const projectTasks = filteredTasks.filter(t => t.project === project.name);
              if (projectTasks.length === 0) return null;
              
              return (
                <div key={project.id} className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between" style={{ borderLeft: `4px solid ${project.color}` }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5">
                        <Icons.Folder className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{project.name}</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{projectTasks.length} Tasks in this project</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800/60">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Task Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Due Date</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assignees</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {projectTasks.map((task, i) => (
                          <TaskRow key={task.id} task={task} index={i} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color, accent, onClick, isActive }: any) => {
  const Icon = Icons[icon as keyof typeof Icons];
  const colorMap: any = {
    emerald: 'bg-emerald-500/10 text-emerald-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
    error: 'bg-error/10 text-error',
    amber: 'bg-amber-500/10 text-amber-500',
  };
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-6 rounded-2xl border transition-all cursor-pointer group",
        isActive 
          ? "bg-primary-container/[0.03] dark:bg-primary-container/[0.05] border-primary-container/30 shadow-md ring-4 ring-primary-container/5" 
          : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary-container/20 hover:shadow-md"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</p>
          <h3 className={cn("text-2xl font-black mt-1", accent ? "text-error" : "text-slate-950 dark:text-white")}>{value}</h3>
        </div>
        <div className={cn("p-2.5 rounded-xl transition-all group-hover:scale-110", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ label }: { label: string }) => (
  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
    {label}
    <Icons.Plus className="h-3 w-3" />
  </button>
);
