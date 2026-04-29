import React from 'react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { motion, AnimatePresence } from 'motion/react';
import { parse, isValid } from 'date-fns';
import { columns, KanbanCard } from './KanbanBoard';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
    return url;
  }
  return `https://${url}`;
};

export const ProjectDetailsView = ({ onViewChange }: { onViewChange: (view: string) => void }) => {
  const { 
    tasks, 
    projects, 
    selectedProjectId, 
    setSelectedProjectId, 
    setTaskModalOpen, 
    setProjectModalOpen,
    addAttachmentToTask, 
    addAttachmentToProject, 
    openTaskDetails, 
    updateProject, 
    deleteTask,
    updateTask,
    inviteToProject,
    orgSettings,
    addOrgCategory,
    addOrgStatus,
    addOrgPhase,
    deleteProject,
    user
  } = useTasks();
  
  const canDeleteProject = user.role === 'Admin' || user.role === 'Manager';
  
  const [showUploadForm, setShowUploadForm] = React.useState(false);
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [editedNotes, setEditedNotes] = React.useState('');
  const [editingField, setEditingField] = React.useState<'category' | 'phase' | 'status' | null>(null);
  const [newVal, setNewVal] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'dueDate' | 'none'>('none');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const [uploadData, setUploadData] = React.useState({
    name: '',
    url: '',
    type: 'doc' as const,
    target: 'project' as 'project' | 'task',
    taskId: ''
  });

  const [projectViewMode, setProjectViewMode] = React.useState<'list' | 'kanban'>('list');
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [isInviting, setIsInviting] = React.useState(false);

  const project = projects.find(p => p.id === selectedProjectId);

  React.useEffect(() => {
    if (project) {
      setEditedNotes(project.notes || '');
    }
  }, [project?.id]);

  const handleInvite = async () => {
    if (!inviteEmail.includes('@')) return;
    setIsInviting(true);
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    inviteToProject(project.id, inviteEmail);
    setIsInviting(false);
    setIsInviteModalOpen(false);
    setInviteEmail('');
  };
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6">
          <Icons.Folder className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Project Not Found</h2>
        <p className="text-slate-500 mt-2 mb-8">The project you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => onViewChange('projects')}
          className="px-6 py-3 bg-primary-container text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:brightness-110 transition-all"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const handleAddField = (type: 'category' | 'phase' | 'status') => {
    if (!newVal.trim()) return;
    if (type === 'category') {
      addOrgCategory(newVal);
      updateProject(project.id, { category: newVal });
    } else if (type === 'phase') {
      addOrgPhase(newVal);
      updateProject(project.id, { phase: newVal });
    } else {
      addOrgStatus(newVal);
      updateProject(project.id, { status: newVal });
    }
    setEditingField(null);
    setNewVal('');
  };

  const projectTasks = tasks.filter(t => t.project === project.name);
  
  const getNormalizedStatus = (status: string) => {
    const normalized = status.toLowerCase().replace(/\s+/g, '-');
    if (normalized === 'done') return 'completed';
    return normalized;
  };

  const getTaskGroupValue = (task: any) => {
    return getNormalizedStatus(task.status); // Simplified for project view
  };

  const { setTasks } = useTasks();

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task being dragged
    const draggedTask = tasks.find(t => t.id === draggableId);
    if (!draggedTask) return;

    // Determine new status if moved to a different column
    let newStatus = draggedTask.status;
    if (destination.droppableId !== source.droppableId) {
      const targetColumn = columns.find(c => c.id === destination.droppableId);
      if (targetColumn) {
        // Map column ID back to status string
        newStatus = targetColumn.title === 'Done' ? 'Completed' : targetColumn.title as any;
      }
    }

    setTasks(prev => {
      const newTasks = [...prev];
      const taskIndex = newTasks.findIndex(t => t.id === draggableId);
      
      if (taskIndex === -1) return prev;

      // Update the task status
      const updatedTask = { ...newTasks[taskIndex], status: newStatus };
      
      // Remove from old position
      newTasks.splice(taskIndex, 1);

      const projectTasksLocal = prev.filter(t => t.project === project.name);
      
      if (destination.droppableId === source.droppableId) {
        const otherColumnTasks = projectTasksLocal.filter(t => getTaskGroupValue(t) === destination.droppableId && t.id !== draggableId);
        otherColumnTasks.splice(destination.index, 0, updatedTask);
        
        const otherTasks = prev.filter(t => t.project !== project.name || getTaskGroupValue(t) !== destination.droppableId);
        return [...otherTasks, ...otherColumnTasks];
      } else {
        const targetColumnTasks = projectTasksLocal.filter(t => getTaskGroupValue(t) === destination.droppableId);
        targetColumnTasks.splice(destination.index, 0, updatedTask);
        
        const otherTasks = prev.filter(t => t.id !== draggableId && (t.project !== project.name || getTaskGroupValue(t) !== destination.droppableId));
        return [...otherTasks, ...targetColumnTasks];
      }
    });

    if (destination.droppableId !== source.droppableId) {
      updateTask(draggableId, { status: newStatus });
    }
  };

  const sortedTasks = React.useMemo(() => {
    if (sortBy === 'none') return projectTasks;
    
    return [...projectTasks].sort((a, b) => {
      if (sortBy === 'dueDate') {
        const dateA = parse(a.dueDate, 'MMM d, yyyy', new Date());
        const dateB = parse(b.dueDate, 'MMM d, yyyy', new Date());
        
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      return 0;
    });
  }, [projectTasks, sortBy, sortOrder]);

  const toggleSort = (field: 'dueDate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const Icon = Icons[project.icon as keyof typeof Icons] || Icons.Boards;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary-container border border-slate-200 dark:border-slate-800 shadow-xl" style={{ borderTop: project.color ? `4px solid ${project.color}` : undefined }}>
            <Icon className="h-10 w-10" style={{ color: project.color }} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onViewChange('projects')}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary-container transition-colors"
              >
                Projects
              </button>
              <span className="text-slate-300 text-xs">/</span>
              
              <div className="relative">
                <button 
                  onClick={() => setEditingField(editingField === 'category' ? null : 'category')}
                  className="text-[10px] font-black text-primary-container uppercase tracking-widest hover:bg-primary-container/5 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                >
                  {project.category}
                  <Icons.Plus className={cn("h-2.5 w-2.5 transition-transform", editingField === 'category' && "rotate-45")} />
                </button>
                {editingField === 'category' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] p-2 space-y-1">
                    {orgSettings.categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          updateProject(project.id, { category: cat });
                          setEditingField(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors",
                          project.category === cat ? "bg-primary-container text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                       <input 
                         autoFocus
                         type="text"
                         placeholder="New category..."
                         value={newVal}
                         onChange={e => setNewVal(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleAddField('category')}
                         className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"
                       />
                       <button 
                         onClick={() => handleAddField('category')}
                         className="w-full py-2 bg-primary-container text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                       >
                         Add New
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{project.name}</h1>
            
            <div className="flex items-center gap-4">
              <div className="relative group/phase inline-block">
                <button 
                  onClick={() => setEditingField(editingField === 'phase' ? null : 'phase')}
                  className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-3 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                >
                  {project.phase}
                  <Icons.Plus className={cn("h-3 w-3 opacity-0 group-hover/phase:opacity-100 transition-all", editingField === 'phase' && "rotate-45 opacity-100")} />
                </button>
                {editingField === 'phase' && (
                  <div className="absolute top-full left-0 mt-[-8px] w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] p-2 space-y-1">
                    {orgSettings.phases.map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          updateProject(project.id, { phase: p });
                          setEditingField(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors",
                          project.phase === p ? "bg-primary-container text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                       <input 
                         autoFocus
                         type="text"
                         placeholder="New phase..."
                         value={newVal}
                         onChange={e => setNewVal(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleAddField('phase')}
                         className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"
                       />
                       <button 
                         onClick={() => handleAddField('phase')}
                         className="w-full py-2 bg-primary-container text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                       >
                         Add New
                       </button>
                    </div>
                  </div>
                )}
              </div>

              {canDeleteProject && (
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this project? All project data will be lost.')) {
                      deleteProject(project.id);
                      onViewChange('projects');
                    }
                  }}
                  className="mb-3 text-[10px] font-black text-slate-400 hover:text-error uppercase tracking-widest transition-colors flex items-center gap-1.5"
                >
                  <Icons.Delete className="h-3 w-3" />
                  Delete Project
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags?.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 bg-primary-container/10 text-primary-container text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary-container/10">
                  {tag}
                </span>
              ))}
            </div>

            {project.description && (
              <p className="max-w-2xl text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {project.team.map((user, i) => (
              <div key={i} className="relative group">
                <img 
                  src={user.avatar} 
                  className="h-10 w-10 rounded-full border-4 border-slate-100 dark:border-slate-950 shadow-md group-hover:-translate-y-1 transition-transform cursor-pointer" 
                  alt={user.name} 
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {user.name}
                </div>
              </div>
            ))}
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary-container transition-colors shadow-sm active:scale-95"
              title="Invite to Team"
            >
              <Icons.Plus className="h-4 w-4" />
            </button>
          </div>
          <button 
            onClick={() => setProjectModalOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            <Icons.Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button 
            onClick={() => setTaskModalOpen(true)}
            className="flex items-center gap-2 px-8 py-4 bg-primary-container text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-container/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <Icons.Plus className="h-4 w-4" />
            <span>Create Task</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Project Metadata</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
              <span className="text-sm font-black text-slate-950 dark:text-white">{project.progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-container rounded-full" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
            </div>
            
            <div className="h-px bg-slate-100 dark:bg-slate-800/60" />
            
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</span>
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{project.dueDate} Remaining</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
              <div className="relative">
                <button 
                  onClick={() => setEditingField(editingField === 'status' ? null : 'status')}
                  className="flex items-center gap-2 group/status"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full", 
                    project.status === 'Completed' ? "bg-emerald-500" : 
                    project.status === 'Draft' ? "bg-slate-500" :
                    "bg-indigo-500"
                  )} />
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover/status:text-primary-container transition-colors">
                    {project.status || 'Active'}
                  </p>
                  <Icons.Plus className={cn("h-3 w-3 opacity-0 group-hover/status:opacity-100 transition-all", editingField === 'status' && "rotate-45 opacity-100")} />
                </button>
                {editingField === 'status' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] p-2 space-y-1">
                    {orgSettings.statuses.map(s => (
                      <button
                        key={s}
                        onClick={() => {
                          updateProject(project.id, { status: s });
                          setEditingField(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors",
                          project.status === s ? "bg-primary-container text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                       <input 
                         autoFocus
                         type="text"
                         placeholder="New status..."
                         value={newVal}
                         onChange={e => setNewVal(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleAddField('status')}
                         className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold outline-none text-slate-900 dark:text-white"
                       />
                       <button 
                         onClick={() => handleAddField('status')}
                         className="w-full py-2 bg-primary-container text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                       >
                         Add New
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-primary-container rounded-[32px] p-8 text-white shadow-xl shadow-primary-container/20">
          <div className="flex items-center justify-between mb-4">
            <Icons.HelpCircle className="h-8 w-8 opacity-50" />
            {isEditingNotes && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingNotes(false)}
                  className="p-1 px-2 border border-white/20 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    updateProject(project.id, { notes: editedNotes });
                    setIsEditingNotes(false);
                  }}
                  className="p-1 px-3 bg-white text-primary-container rounded-lg text-[9px] font-black uppercase transition-all shadow-sm"
                >
                  Save
                </button>
              </div>
            )}
          </div>
          <h4 className="text-lg font-black uppercase tracking-tight mb-2">Internal Notes</h4>
          {isEditingNotes ? (
            <textarea 
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              autoFocus
              className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-3 text-xs font-medium text-white placeholder:text-white/40 outline-none focus:ring-4 focus:ring-white/5 transition-all resize-none mb-4"
              placeholder="Type project notes here..."
            />
          ) : (
            <p className="text-xs font-medium text-white/80 leading-relaxed mb-6 whitespace-pre-wrap">
              {project.notes || 'No notes added yet. Click edit to add project details.'}
            </p>
          )}
          {!isEditingNotes && (
            <button 
              onClick={() => setIsEditingNotes(true)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Edit Notes
            </button>
          )}
        </div>
      </div>

      <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Project Tasks ({projectTasks.length})</h3>
                
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => setProjectViewMode('list')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                      projectViewMode === 'list' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Icons.Tasks className="h-3 w-3" />
                    List
                  </button>
                  <button 
                    onClick={() => setProjectViewMode('kanban')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                      projectViewMode === 'kanban' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Icons.Boards className="h-3 w-3" />
                    Kanban
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Icons.Search className="h-3.5 w-3.5 text-slate-400" />
                  <input type="text" placeholder="Search tasks..." className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 w-32" />
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Icons.More className="h-5 w-5" />
                </button>
              </div>
            </div>

            {projectViewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/20">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Name</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                      <th 
                        className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary-container transition-colors group"
                        onClick={() => toggleSort('dueDate')}
                      >
                        <div className="flex items-center gap-2">
                          Due Date
                          <Icons.ArrowRight className={cn(
                            "h-3 w-3 transition-transform", 
                            sortBy === 'dueDate' ? (sortOrder === 'asc' ? "-rotate-90 text-primary-container" : "rotate-90 text-primary-container") : "opacity-0 group-hover:opacity-50"
                          )} />
                        </div>
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignees</th>
                      <th className="px-8 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {sortedTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No tasks added to this project yet.</p>
                        </td>
                      </tr>
                    ) : (
                      sortedTasks.map((task, i) => (
                        <motion.tr 
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => openTaskDetails(task.id)}
                          className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary-container transition-colors uppercase tracking-tight">{task.title}</span>
                              <span className="text-[10px] font-bold text-slate-400">{task.id}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              task.status === 'Completed' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" :
                              task.status === 'In Progress' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10" :
                              "bg-slate-100 text-slate-600 dark:bg-slate-800"
                            )}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              task.priority === 'High' ? "text-rose-500" :
                              task.priority === 'Medium' ? "text-amber-500" :
                              "text-slate-400"
                            )}>
                              {task.priority || 'Medium'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                              {task.dueDate}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-1.5">
                                {task.assignees.map((user, j) => (
                                  <img key={j} src={user.avatar} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" title={user.name} alt={user.name} />
                                ))}
                              </div>
                              <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                {task.assignees.length === 1 ? task.assignees[0].name : `${task.assignees.length} Members`}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Delete this task?')) deleteTask(task.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-error transition-all relative z-10"
                                title="Delete Task"
                              >
                                <Icons.Delete className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                                <Icons.More className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="p-8 space-y-12">
                  <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-6">
                    {columns.filter(c => c.id !== 'backlog').map((column) => (
                      <div key={column.id} className="flex-1 min-w-[200px] flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", column.color)} />
                            <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-widest">{column.title}</h3>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] font-black rounded-full">
                              {projectTasks.filter(t => getTaskGroupValue(t) === column.id).length || 0}
                            </span>
                          </div>
                        </div>

                        <Droppable droppableId={column.id}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={cn(
                                "flex-1 space-y-4 min-h-[100px] p-2 rounded-2xl border-2 border-transparent transition-colors",
                                snapshot.isDraggingOver ? "bg-slate-100/50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-slate-800" : ""
                              )}
                            >
                              {projectTasks
                                .filter(t => getTaskGroupValue(t) === column.id)
                                .map((task, i) => (
                                  <KanbanCard key={task.id} task={task} index={i} onDelete={() => deleteTask(task.id)} />
                                ))
                              }
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                        
                        <button 
                          onClick={() => setTaskModalOpen(true)}
                          className="w-full py-3 border-2 border-dashed border-slate-100 dark:border-slate-800/40 rounded-2xl text-slate-400 hover:border-primary-container/40 hover:text-primary-container hover:bg-white dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 mt-2 group"
                        >
                          <Icons.Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Add Task</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Backlog Section Underneath */}
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="flex items-center gap-4 mb-6">
                      <Icons.Boards className="h-4 w-4 text-slate-300" />
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Project Backlog</h3>
                      <div className="h-px flex-1 bg-slate-50 dark:bg-slate-800/40" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <Droppable droppableId="backlog" direction="horizontal">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={cn(
                              "col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[100px] p-2 rounded-3xl border-2 border-transparent transition-colors",
                              snapshot.isDraggingOver ? "bg-slate-100/50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-slate-800" : ""
                            )}
                          >
                            {projectTasks
                              .filter(t => getTaskGroupValue(t) === 'backlog')
                              .map((task, i) => (
                                <KanbanCard key={task.id} task={task} index={i} onDelete={() => deleteTask(task.id)} />
                              ))
                            }
                            {provided.placeholder}
                            
                            <button 
                              onClick={() => setTaskModalOpen(true)}
                              className="h-[180px] border-2 border-dashed border-slate-100 dark:border-slate-800/40 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-primary-container/40 hover:text-primary-container hover:bg-white dark:hover:bg-white/5 transition-all group"
                            >
                              <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-900 group-hover:scale-110 transition-transform">
                                <Icons.Plus className="h-4 w-4" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">Add to Backlog</span>
                            </button>
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                </div>
              </DragDropContext>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Project Assets & Documentation</h3>
              <button 
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all"
              >
                <Icons.Plus className={cn("h-3.5 w-3.5 transition-transform", showUploadForm && "rotate-45")} />
                {showUploadForm ? 'Cancel' : 'Upload New'}
              </button>
            </div>

            <AnimatePresence>
              {showUploadForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Q4 Brand Guide"
                          value={uploadData.name}
                          onChange={e => setUploadData({ ...uploadData, name: e.target.value })}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:ring-4 focus:ring-primary-container/10 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Type</label>
                        <select 
                          value={uploadData.type}
                          onChange={e => setUploadData({ ...uploadData, type: e.target.value as any })}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:ring-4 focus:ring-primary-container/10 outline-none transition-all"
                        >
                          <option value="doc">Google Drive / Doc</option>
                          <option value="pdf">PDF File</option>
                          <option value="image">Screenshot / Image</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link URL</label>
                        <input 
                          type="text" 
                          placeholder="https://drive.google.com/..."
                          value={uploadData.url}
                          onChange={e => setUploadData({ ...uploadData, url: e.target.value })}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:ring-4 focus:ring-primary-container/10 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Scope</label>
                        <select 
                          value={uploadData.target}
                          onChange={e => setUploadData({ ...uploadData, target: e.target.value as any, taskId: '' })}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:ring-4 focus:ring-primary-container/10 outline-none transition-all"
                        >
                          <option value="project">General Project Asset</option>
                          <option value="task">Linked to Specific Task</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link to Task</label>
                        <select 
                          value={uploadData.taskId}
                          disabled={uploadData.target === 'project'}
                          onChange={e => setUploadData({ ...uploadData, taskId: e.target.value })}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:ring-4 focus:ring-primary-container/10 outline-none transition-all disabled:opacity-30"
                        >
                          <option value="">{uploadData.target === 'project' ? 'None (Project Level)' : 'Select a task...'}</option>
                          {projectTasks.map(t => (
                            <option key={t.id} value={t.id}>{t.title} ({t.id})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (!uploadData.name || !uploadData.url) return;
                        if (uploadData.target === 'task' && !uploadData.taskId) return;

                        if (uploadData.target === 'project') {
                          addAttachmentToProject(project.id, {
                            name: uploadData.name,
                            url: uploadData.url,
                            type: uploadData.type
                          });
                        } else {
                          addAttachmentToTask(uploadData.taskId, {
                            name: uploadData.name,
                            url: uploadData.url,
                            type: uploadData.type
                          });
                        }
                        
                        setUploadData({ name: '', url: '', type: 'doc', target: 'project', taskId: '' });
                        setShowUploadForm(false);
                      }}
                      disabled={!uploadData.name || !uploadData.url || (uploadData.target === 'task' && !uploadData.taskId)}
                      className="w-full py-3 bg-primary-container text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Confirm Upload
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ...project.attachments.map(att => ({ ...att, taskTitle: 'Project Wide', taskId: 'project' })),
                ...projectTasks.flatMap(task => 
                  task.attachments.map(att => ({ ...att, taskTitle: task.title, taskId: task.id }))
                )
              ].length === 0 ? (
                <div className="md:col-span-2 py-12 bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                  <Icons.File className="h-8 w-8 mb-3 opacity-30" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No documentation found for this project</p>
                </div>
              ) : (
                [
                  ...project.attachments.map(att => ({ ...att, taskTitle: 'Project Wide', taskId: 'project' })),
                  ...projectTasks.flatMap(task => 
                    task.attachments.map(att => ({ ...att, taskTitle: task.title, taskId: task.id }))
                  )
                ].map((asset, i) => (
                  <motion.div
                    key={`${asset.taskId}-${asset.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between group hover:border-primary-container/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm",
                        asset.type === 'pdf' ? "bg-rose-50 text-rose-500" :
                        asset.type === 'image' ? "bg-emerald-50 text-emerald-500" :
                        "bg-indigo-50 text-indigo-500"
                      )}>
                        {asset.type === 'image' ? <Icons.Image className="h-6 w-6" /> : <Icons.File className="h-6 w-6" />}
                      </div>
                      <div className="flex flex-col">
                        <a 
                          href={ensureAbsoluteUrl(asset.url)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm font-black text-slate-900 dark:text-white hover:text-primary-container transition-colors truncate max-w-[150px] uppercase tracking-tight"
                        >
                          {asset.name}
                        </a>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Linked to: {asset.taskTitle}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <a 
                        href={ensureAbsoluteUrl(asset.url)} 
                        download 
                        className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg hover:text-primary-container transition-all"
                       >
                        <Icons.Download className="h-4 w-4" />
                       </a>
                       <a 
                        href={ensureAbsoluteUrl(asset.url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg hover:text-primary-container transition-all"
                       >
                        <Icons.ExternalLink className="h-4 w-4" />
                       </a>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

      <AnimatePresence>
        {isInviteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setIsInviteModalOpen(false)}
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
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Invite Team</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Add new members to {project.name}</p>
                  </div>
                  <button 
                    onClick={() => setIsInviteModalOpen(false)}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Icons.Plus className="h-5 w-5 rotate-45" />
                  </button>
                </div>

                <div className="space-y-4">
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
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleInvite()}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-4 focus:ring-primary-container/10 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-primary-container/5 rounded-2xl border border-primary-container/10">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-container text-white flex items-center justify-center shrink-0">
                        <Icons.HelpCircle className="h-4 w-4" />
                      </div>
                      <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 leading-relaxed">
                        Invited users will have <span className="font-black uppercase">Contributor</span> access by default.
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleInvite}
                  disabled={!inviteEmail.includes('@') || isInviting}
                  className="w-full py-5 bg-primary-container text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-container/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                >
                  {isInviting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Invite...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Plus className="h-4 w-4" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
