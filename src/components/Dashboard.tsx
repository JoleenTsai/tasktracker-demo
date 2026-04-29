import React from 'react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { motion, AnimatePresence } from 'motion/react';

export const Dashboard = ({ onViewChange }: { onViewChange: (view: string) => void }) => {
  const { 
    tasks, 
    projects, 
    engagements, 
    personalTodos,
    user,
    updateTaskStatus,
    togglePersonalTodo,
    toggleSubtask,
    setTaskModalOpen, 
    setSelectedProjectId, 
    openTaskDetails 
  } = useTasks();
  const canEdit = user.role !== 'Viewer';
  const [activeMetric, setActiveMetric] = React.useState<string | null>(null);
  const [completionView, setCompletionView] = React.useState<'project' | 'member'>('project');
  
  const pendingEngagements = engagements.filter(e => e.status === 'Upcoming' || e.status === 'Active');

  // Derive all tasks that are relevant to the current user (directly assigned, have due dates, or have assigned subtasks)
  const workUnits = React.useMemo(() => {
    return tasks
      .filter(task => 
        task.assignees.some(a => a.id === user.id) || 
        task.dueDate || 
        task.subtasks.some(st => st.assignees.some(a => a.id === user.id))
      )
      .map(task => ({
        ...task,
        type: 'card' as const,
        completed: task.status === 'Done'
      }));
  }, [tasks, user.id]);

  const checklistItems = React.useMemo(() => {
    const personal = personalTodos.map(todo => ({ ...todo, type: 'personal' as const }));
    const work = workUnits;
    
    // Sort by priority/deadline or just show all for now
    // Filter for pending items for the dashboard
    return [
      ...personal.filter(t => !t.completed),
      ...work.filter(w => !w.completed || w.subtasks.some(st => !st.completed && st.assignees.some(a => a.id === user.id)))
    ];
  }, [personalTodos, workUnits, user.id]);

  const velocityBreakdown = [
    { label: 'Feature: Platform Migration', value: '+12 pts', type: 'gain', icon: 'Boards', taskId: tasks[0]?.id },
    { label: 'Feature: Auth Refactor', value: '+8 pts', type: 'gain', icon: 'Folder', taskId: tasks[1]?.id },
    { label: 'Bug: Performance regression', value: '+5 pts', type: 'gain', icon: 'Tasks', taskId: tasks[2]?.id },
    { label: 'Blocker: API Downtime', value: '-3 pts', type: 'loss', icon: 'Help', taskId: tasks[3]?.id },
    { label: 'Process: Planning Overhead', value: '-2 pts', type: 'loss', icon: 'Calendar', taskId: tasks[4]?.id },
  ];

  const handleProjectClick = (id: string) => {
    setSelectedProjectId(id);
    onViewChange('project-details');
  };

  const projectCompletion = projects.map(project => {
    const projectTasks = tasks.filter(t => t.project === project.name);
    const completedTasks = projectTasks.filter(t => t.status === 'Completed');
    const rate = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;
    return { 
      id: project.id,
      name: project.name, 
      rate,
      total: projectTasks.length,
      completed: completedTasks.length
    };
  });

  const userCompletion = React.useMemo(() => {
    // Get unique assignees
    const assigneeMap = new Map();
    tasks.forEach(task => {
      task.assignees.forEach(user => {
        if (!assigneeMap.has(user.id)) {
          assigneeMap.set(user.id, user);
        }
      });
    });

    return Array.from(assigneeMap.values()).map(user => {
      const userTasks = tasks.filter(t => t.assignees.some(a => a.id === user.id));
      const completedTasks = userTasks.filter(t => t.status === 'Completed');
      const rate = userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0;
      return { 
        ...user, 
        rate,
        total: userTasks.length,
        completed: completedTasks.length
      };
    });
  }, [tasks]);

  const overdueTasks = tasks.filter(task => {
    if (task.status === 'Completed') return false;
    // Simple mock overdue check: date is in 2023 or 2024 (current is 2026)
    return task.dueDate.includes('2023') || task.dueDate.includes('2024');
  });

  const remainingPoints = tasks.filter(t => t.status !== 'Completed').reduce((acc, t) => acc + (t.points || 0), 0);
  
  const activityGroups = React.useMemo(() => {
    const activities: any[] = [];
    tasks.forEach(task => {
      task.activity.forEach(act => {
        activities.push({
          ...act,
          taskId: task.id,
          taskTitle: task.title
        });
      });
    });

    // Sort by createdAt descending, fall back to ID if createdAt is missing
    const sorted = activities.sort((a, b) => {
      if (b.createdAt && a.createdAt) return b.createdAt - a.createdAt;
      return b.id.localeCompare(a.id);
    });

    const groups: { label: string; items: any[] }[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;

    const sections = {
      Today: [] as any[],
      Yesterday: [] as any[],
      Earlier: [] as any[]
    };

    sorted.slice(0, 8).forEach(act => {
      if (act.createdAt >= today) sections.Today.push(act);
      else if (act.createdAt >= yesterday) sections.Yesterday.push(act);
      else sections.Earlier.push(act);
    });

    if (sections.Today.length > 0) groups.push({ label: 'Today', items: sections.Today });
    if (sections.Yesterday.length > 0) groups.push({ label: 'Yesterday', items: sections.Yesterday });
    if (sections.Earlier.length > 0) groups.push({ label: 'Earlier', items: sections.Earlier });

    return groups;
  }, [tasks]);

  return (
    <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Workspace Overview</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back! Your team has {tasks.length} active tasks today.</p>
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
        </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Completion Rate" 
          value="84.2%" 
          trend="+12%" 
          icon="Tasks" 
          color="primary" 
          progress={84} 
          onClick={() => setActiveMetric(activeMetric === 'completion' ? null : 'completion')}
          isActive={activeMetric === 'completion'}
        />
        <StatCard 
          title="Team Velocity" 
          value="42 pts" 
          trend="+5 pts" 
          icon="Boards" 
          color="primary" 
          tooltip="Calculated as the average number of story points completed by the team per sprint over the last 3 sprints."
          onClick={() => setActiveMetric(activeMetric === 'velocity' ? null : 'velocity')}
          isActive={activeMetric === 'velocity'}
        />
        <StatCard 
          title="Account Engagements" 
          value={pendingEngagements.length.toString()} 
          trend={pendingEngagements.length > 2 ? "High Volume" : "Stable"} 
          icon="More" 
          color="primary" 
          onClick={() => setActiveMetric(activeMetric === 'meetings' ? null : 'meetings')}
          isActive={activeMetric === 'meetings'}
        />
        <StatCard 
          title="Overdue Items" 
          value={overdueTasks.length.toString()} 
          trend="Critical" 
          icon="Help" 
          color="error" 
          onClick={() => setActiveMetric(activeMetric === 'overdue' ? null : 'overdue')}
          isActive={activeMetric === 'overdue'}
        />
        <StatCard 
          title="Points Remaining" 
          value={`${remainingPoints} pts`} 
          trend="On track" 
          icon="Tasks" 
          color="primary" 
          onClick={() => setActiveMetric(activeMetric === 'points' ? null : 'points')}
          isActive={activeMetric === 'points'}
        />
      </div>

      <AnimatePresence>
        {activeMetric === 'meetings' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-primary-container/[0.03] dark:bg-primary-container/[0.05] border border-primary-container/10 rounded-2xl mb-6"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-primary-container">
                  <Icons.More className="h-5 w-5" />
                  <h3 className="font-black uppercase tracking-widest text-xs">Engagement Tracker</h3>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onViewChange('engagements')}
                    className="text-[10px] font-black uppercase tracking-widest text-primary-container hover:underline"
                  >
                    View All
                  </button>
                  <button 
                    onClick={() => setActiveMetric(null)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {engagements.map(engagement => (
                  <div 
                    key={engagement.id}
                    className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <img src={engagement.clientContact.avatar} className="h-6 w-6 rounded-full border border-slate-200" alt="" />
                        <div>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{engagement.clientContact.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{engagement.clientContact.role}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                        engagement.status === 'Active' ? "bg-primary-container/10 text-primary-container" :
                        engagement.status === 'Completed' ? "bg-green-500/10 text-green-500" :
                        engagement.status === 'On Hold' ? "bg-amber-500/10 text-amber-500" :
                        "bg-slate-200 text-slate-600"
                      )}>
                        {engagement.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2">{engagement.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed italic">
                      "{engagement.description}"
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 dark:border-slate-900">
                      <div className="flex items-center gap-2">
                        <Icons.Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">{engagement.engagementDate}</span>
                      </div>
                      {engagement.cadence === 'Recurring' && engagement.recurrencePattern && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-container/5 rounded-md">
                          <Icons.RefreshCw className="w-2.5 h-2.5 text-primary-container animate-spin-slow" />
                          <span className="text-[8px] font-black uppercase text-primary-container tracking-tighter">
                            {engagement.recurrencePattern}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMetric === 'points' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-primary-container/[0.03] dark:bg-primary-container/[0.05] border border-primary-container/10 rounded-2xl mb-6"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-primary-container">
                  <Icons.Tasks className="h-5 w-5" />
                  <h3 className="font-black uppercase tracking-widest text-xs">Points Breakdown</h3>
                </div>
                <button 
                  onClick={() => setActiveMetric(null)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">By Project</h4>
                  <div className="space-y-3">
                    {projects.map(project => {
                      const projectPoints = tasks
                        .filter(t => t.project === project.name && t.status !== 'Completed')
                        .reduce((acc, t) => acc + (t.points || 0), 0);
                      const percentage = remainingPoints > 0 ? (projectPoints / remainingPoints) * 100 : 0;
                      
                      if (projectPoints === 0) return null;

                      return (
                        <div key={project.id} className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                            <span className="text-slate-700 dark:text-slate-300">{project.name}</span>
                            <span className="text-primary-container">{projectPoints} pts</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${percentage}%` }} 
                              className="h-full bg-primary-container" 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">By Priority</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {['Urgent', 'High', 'Medium', 'Low'].map(priority => {
                      const priorityPoints = tasks
                        .filter(t => t.priority === priority && t.status !== 'Completed')
                        .reduce((acc, t) => acc + (t.points || 0), 0);
                      
                      return (
                        <div key={priority} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              priority === 'Urgent' ? 'bg-error' :
                              priority === 'High' ? 'bg-amber-500' :
                              priority === 'Medium' ? 'bg-primary-container' : 'bg-slate-400'
                            )} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{priority}</span>
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white">{priorityPoints}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMetric === 'velocity' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-primary-container/[0.03] dark:bg-primary-container/[0.05] border border-primary-container/10 rounded-2xl mb-6"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-primary-container">
                  <Icons.Boards className="h-5 w-5" />
                  <h3 className="font-black uppercase tracking-widest text-xs">Velocity Dynamics</h3>
                </div>
                <button 
                  onClick={() => setActiveMetric(null)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {velocityBreakdown.map((item, i) => {
                  const ItemIcon = Icons[item.icon as keyof typeof Icons];
                  const task = tasks.find(t => t.id === item.taskId);
                  const displayLabel = task?.title || item.label;

                  return (
                    <div 
                      key={i} 
                      onClick={() => item.taskId && openTaskDetails(item.taskId)}
                      className={cn(
                        "p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 transition-all group/vcard",
                        item.taskId ? "cursor-pointer hover:border-primary-container/30 hover:shadow-md" : ""
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <div className={cn(
                            "p-1 rounded-md mb-2",
                            item.type === 'gain' ? "bg-green-500/10 text-green-500" : "bg-error/10 text-error"
                          )}>
                            <ItemIcon className="h-3 w-3" />
                          </div>
                          <span className={cn(
                            "text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900",
                            item.type === 'gain' ? "text-green-500" : "text-error"
                          )}>
                            {item.value}
                          </span>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-900 dark:text-white leading-tight line-clamp-3 uppercase tracking-tight group-hover/vcard:text-primary-container transition-colors">
                          {displayLabel}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                          {item.type === 'gain' ? 'Velocity Gain' : 'Velocity Loss'}
                        </span>
                        {item.taskId && <Icons.Expand className="h-2.5 w-2.5 text-slate-300 group-hover/vcard:text-primary-container transition-colors" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMetric === 'completion' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-primary-container/[0.03] dark:bg-primary-container/[0.05] border border-primary-container/10 rounded-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2 text-primary-container">
                    <Icons.Tasks className="h-5 w-5" />
                    <h3 className="font-black uppercase tracking-widest text-xs">Completion Breakdown</h3>
                  </div>
                  
                  <div className="flex p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg w-fit">
                    <button 
                      onClick={() => setCompletionView('project')}
                      className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        completionView === 'project' 
                          ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      By Project
                    </button>
                    <button 
                      onClick={() => setCompletionView('member')}
                      className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        completionView === 'member' 
                          ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      By Member
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveMetric(null)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {completionView === 'project' ? (
                  projectCompletion.map((pc, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleProjectClick(pc.id)}
                      className="space-y-3 p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:border-primary-container/30 hover:shadow-md transition-all group/pcomp"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1 group-hover/pcomp:text-primary-container transition-colors">{pc.name}</h4>
                        <span className="text-[10px] font-black text-primary-container">{pc.rate}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${pc.rate}%` }} 
                          className="h-full bg-primary-container" 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                        <span>{pc.completed} Completed</span>
                        <span>{pc.total} Total Tasks</span>
                      </div>
                    </div>
                  ))
                ) : (
                  userCompletion.map((uc, i) => (
                    <div key={i} className="space-y-3 p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={uc.avatar} className="h-8 w-8 rounded-full border border-slate-100 dark:border-slate-800" alt={uc.name} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{uc.name}</h4>
                            <span className="text-[10px] font-black text-primary-container">{uc.rate}%</span>
                          </div>
                          <div className="mt-1 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${uc.rate}%` }} 
                              className="h-full bg-primary-container" 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 pl-11">
                        <span>{uc.completed} / {uc.total} Tasks</span>
                        <span>{uc.role}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMetric === 'overdue' && overdueTasks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-error/[0.03] dark:bg-error/[0.05] border border-error/10 rounded-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-error">
                  <Icons.Help className="h-5 w-5" />
                  <h3 className="font-black uppercase tracking-widest text-xs">Overdue Tasks Attention Required</h3>
                </div>
                <button 
                  onClick={() => setActiveMetric(null)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => openTaskDetails(task.id)}
                    className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-error/10 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-error uppercase tracking-widest">{task.dueDate}</span>
                      <div className="h-2 w-2 rounded-full bg-error animate-pulse" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-error transition-colors">{task.title}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{task.project}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {task.assignees.map((user, i) => (
                            <img key={i} src={user.avatar} className="h-5 w-5 rounded-full border border-white dark:border-slate-800" alt={user.name} />
                          ))}
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase">
                          {task.assignees.length === 1 ? task.assignees[0].name : `${task.assignees.length} Assignees`}
                        </span>
                      </div>
                      <Icons.Expand className="h-3 w-3 text-slate-300 group-hover:text-error" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">My Checklist</h3>
              <span className="text-[10px] font-black px-1.5 py-0.5 bg-primary-container/10 text-primary-container rounded uppercase tracking-tighter">
                {checklistItems.length} Pending
              </span>
            </div>
            <button 
              onClick={() => onViewChange('checklist')}
              className="text-xs font-bold text-primary-container hover:underline"
            >
              Manage checklist
            </button>
          </div>
          <div className={cn(
            "px-6 pb-6",
            checklistItems.length > 5 ? "max-h-[500px] overflow-y-auto custom-scrollbar" : ""
          )}>
            <div className="flex flex-col">
              {checklistItems.map((item: any, index: number) => {
                const isLast = index === checklistItems.length - 1;
                
                if (item.type === 'personal') {
                  return (
                     <div 
                       key={item.id}
                       className={cn(
                         "py-4 flex items-start gap-4 group transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5 px-2 -mx-2 rounded-lg",
                         !isLast && "border-b border-slate-100 dark:border-slate-800/60"
                       )}
                     >
                       <button 
                         onClick={() => togglePersonalTodo(item.id)}
                         className={cn(
                           "mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0",
                           item.completed 
                             ? "bg-primary-container border-primary-container text-white" 
                             : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                         )}
                       >
                         {item.completed && <Icons.Check className="w-3 h-3" />}
                       </button>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-0.5">
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Personal</span>
                           {item.dueDate && (
                              <div className="flex items-center gap-1 opacity-60">
                                <Icons.Calendar className="w-2.5 h-2.5 text-primary-container" />
                                <span className="text-[9px] font-black uppercase tracking-tighter">Due {item.dueDate}</span>
                              </div>
                            )}
                         </div>
                         <div className="flex items-center gap-3">
                           <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{item.title}</h4>
                           <span className={cn(
                              "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                              item.priority === 'Urgent' ? "bg-error/10 text-error" : 
                              item.priority === 'High' ? "bg-amber-500/10 text-amber-500" :
                              "bg-slate-200/50 dark:bg-white/5 text-slate-400"
                            )}>
                              {item.priority}
                            </span>
                         </div>
                       </div>
                     </div>
                  );
                } else {
                  const mySubtasks = item.subtasks.filter((st: any) => st.assignees.some((a: any) => a.id === user.id));
                  return (
                     <div 
                      key={item.id}
                      className={cn(
                        "py-4 flex items-start gap-4 group transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5 px-2 -mx-2 rounded-lg",
                        !isLast && "border-b border-slate-100 dark:border-slate-800/60"
                      )}
                    >
                      <button 
                        onClick={() => {
                          const newStatus = item.completed ? 'To Do' : 'Done';
                          updateTaskStatus(item.id, newStatus);
                        }}
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0",
                          item.completed 
                            ? "bg-primary-container border-primary-container text-white" 
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        )}
                      >
                        {item.completed && <Icons.Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary-container">Work Card</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">/ {item.project}</span>
                          </div>
                          {item.dueDate && (
                            <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded tracking-tighter">
                              {item.dueDate}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{item.title}</h4>
                          <button 
                            onClick={() => openTaskDetails(item.id)}
                            className="text-[10px] font-black uppercase text-primary-container hover:underline tracking-widest flex-shrink-0"
                          >
                            Details
                          </button>
                        </div>
                        
                        {mySubtasks.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5">
                             {mySubtasks.slice(0, 2).map((st: any) => (
                               <div key={st.id} className="flex items-center gap-2 min-w-0">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     toggleSubtask(item.id, st.id);
                                   }}
                                   className={cn(
                                     "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all flex-shrink-0",
                                     st.completed ? "bg-primary-container border-primary-container text-white" : "border-slate-200 dark:border-slate-700"
                                   )}
                                 >
                                   {st.completed && <Icons.Check className="w-2.5 h-2.5" />}
                                 </button>
                                 <span className={cn(
                                   "text-[11px] font-medium truncate max-w-[150px]",
                                   st.completed ? "line-through text-slate-400" : "text-slate-600 dark:text-slate-400"
                                 )}>
                                   {st.title}
                                 </span>
                               </div>
                             ))}
                             {mySubtasks.length > 2 && (
                               <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">+{mySubtasks.length - 2} more duties</span>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              })}
              {checklistItems.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                  <Icons.CheckCircle2 className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">Nothing on your plate</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
          <div className="space-y-8 relative ml-4">
            <div className="absolute left-[-17px] top-6 bottom-6 w-px bg-slate-100 dark:bg-slate-800" />
            
            {activityGroups.map((group) => (
              <div key={group.label} className="space-y-4">
                <div className="relative">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white dark:bg-[#0a0f1d] pr-2 relative z-10">
                    {group.label}
                  </span>
                </div>
                
                <div className="space-y-6">
                  {group.items.map((activity) => {
                    let actionText = 'commented on';
                    if (activity.type === 'status_change') actionText = `changed status to ${activity.newValue} for`;
                    if (activity.type === 'priority_change') actionText = `updated priority to ${activity.newValue} for`;
                    
                    return (
                      <ActivityItem
                        key={activity.id}
                        user={activity.user.name}
                        action={actionText}
                        target={activity.taskTitle}
                        time={activity.timestamp}
                        type={activity.type}
                        content={activity.content}
                        onClick={() => openTaskDetails(activity.taskId)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {activityGroups.length === 0 && (
              <p className="text-xs text-slate-400 italic">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="font-bold text-slate-900 dark:text-white">Active Projects</h3>
              <button className="text-xs font-bold text-primary-container hover:underline">View all</button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-primary-container rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Icons.Tasks className="h-5 w-5" />
              Deadlines Approaching
            </h3>
            <div className="space-y-4">
              {tasks
                .filter(t => t.status !== 'Completed')
                .slice(0, 3)
                .map((task, i) => (
                  <div 
                    key={task.id} 
                    onClick={() => openTaskDetails(task.id)}
                    className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer group/deadline"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">{task.dueDate}</p>
                      <Icons.Expand className="h-3 w-3 text-white/30 group-hover/deadline:text-white transition-colors" />
                    </div>
                    <p className="font-bold line-clamp-1">{task.title}</p>
                    <p className="text-[10px] opacity-70 mt-2 uppercase tracking-widest">{task.project}</p>
                  </div>
                ))}
              {tasks.filter(t => t.status !== 'Completed').length === 0 && (
                <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100/50">No upcoming deadlines</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => onViewChange('calendar')}
              className="w-full mt-6 py-2.5 bg-white text-primary-container rounded-xl font-black text-xs hover:bg-slate-50 transition-colors shadow-lg active:scale-95"
            >
              Full Calendar
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Task Distribution</h3>
            <div className="relative flex items-center justify-center h-48">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="50" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                <circle cx="64" cy="64" r="50" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray="314" strokeDashoffset="100" strokeLinecap="round" className="text-primary-container" />
                <circle cx="64" cy="64" r="50" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray="314" strokeDashoffset="250" strokeLinecap="round" className="text-tertiary" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">42</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <DistributionLabel color="bg-primary-container" label="Product" value={18} />
              <DistributionLabel color="bg-tertiary" label="Development" value={12} />
              <DistributionLabel color="bg-slate-400" label="Design" value={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, icon, color, progress, onClick, isActive, tooltip }: any) => {
  const Icon = Icons[icon as keyof typeof Icons];
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-900/40 p-6 rounded-2xl border transition-all group relative",
        onClick ? "cursor-pointer" : "",
        isActive 
          ? "border-primary-container ring-1 ring-primary-container shadow-lg" 
          : "border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary-container/30"
      )}
    >
      <div className="flex justify-between items-start">
        <div className={cn("p-2 rounded-lg", color === 'error' ? "bg-error/10 text-error" : "bg-primary-container/10 text-primary-container")}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn("text-[10px] font-black px-2 py-1 rounded tracking-widest uppercase", trend === 'Critical' ? "bg-error/10 text-error" : (trend.includes('+') ? "bg-green-500/10 text-green-500" : "bg-slate-500/10 text-slate-500"))}>
            {trend}
          </span>
          {tooltip && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }}
              className="text-slate-400 hover:text-primary-container transition-colors p-1"
            >
              <Icons.Help className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-20 left-6 right-6 bottom-full mb-2 p-4 bg-slate-900 text-white rounded-xl text-[10px] leading-relaxed shadow-2xl border border-white/10"
          >
            <div className="flex justify-between items-start gap-4">
              <p className="font-medium">{tooltip}</p>
              <button onClick={() => setShowTooltip(false)} className="text-white/40 hover:text-white">
                <Icons.Plus className="h-3 w-3 rotate-45" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4">
        <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{title}</p>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-primary-container" />
        </div>
      )}
    </div>
  );
};

const ProjectCard = (props: any) => {
  const { project, onClick } = props;
  const Icon = Icons[project.icon as keyof typeof Icons] || Icons.Boards;
  return (
    <div 
      onClick={onClick}
      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:border-primary-container/30 hover:shadow-md transition-all group cursor-pointer bg-slate-50/50 dark:bg-slate-900/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container shadow-sm group-hover:scale-110 transition-transform">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{project.name}</h4>
          <p className="text-[10px] text-slate-500 font-medium">{project.phase}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-slate-500">Progress</span>
          <span className="text-slate-900 dark:text-white">{project.progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} className="h-full bg-primary-container rounded-full" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex -space-x-1.5">
          {project.team.map((user: any, i: number) => (
            <img key={i} src={user.avatar} className="h-5 w-5 rounded-full border-2 border-white dark:border-slate-900" alt="" />
          ))}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due in {project.dueDate}</span>
      </div>
    </div>
  );
};

const ActivityItem = ({ user, action, target, time, type, content, onClick }: any) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative flex items-start gap-4 transition-all",
        onClick ? "cursor-pointer hover:translate-x-1" : ""
      )}
    >
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-950 z-10 shrink-0",
        type === 'comment' ? "bg-indigo-100 text-indigo-600" : 
        type === 'priority_change' ? "bg-amber-100 text-amber-600" :
        "bg-emerald-100 text-emerald-600"
      )}>
        {type === 'comment' ? <Icons.More className="h-4 w-4" /> : 
         type === 'priority_change' ? <Icons.Priority className="h-4 w-4" /> :
         <Icons.Tasks className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-slate-950 dark:text-slate-200">
          <span className="font-black text-slate-900 dark:text-white">{user}</span> {action} <span className="font-black text-primary-container dark:text-primary hover:underline">{target}</span>
        </p>
        {content && (
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl rounded-tl-none border border-slate-100 dark:border-slate-800 italic text-xs text-slate-600 dark:text-slate-400">
            "{content}"
          </div>
        )}
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{time}</p>
      </div>
    </div>
  );
};

const DistributionLabel = ({ color, label, value }: any) => (
  <div className="flex justify-between items-center text-xs">
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-slate-600 dark:text-slate-400 font-medium">{label}</span>
    </div>
    <span className="font-black text-slate-900 dark:text-white">{value}</span>
  </div>
);
