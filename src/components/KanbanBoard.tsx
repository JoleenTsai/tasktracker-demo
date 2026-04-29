import React from 'react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { users } from '../constants';
import { FilterDropdown } from './FilterDropdown';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-400' },
  { id: 'to-do', title: 'To Do', color: 'bg-indigo-400' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-primary-container' },
  { id: 'blocked', title: 'Blocked', color: 'bg-error' },
  { id: 'in-review', title: 'In Review', color: 'bg-amber-400' },
  { id: 'completed', title: 'Done', color: 'bg-emerald-500' }
];

export const KanbanBoard = () => {
  const { 
    tasks,
    filteredTasks, 
    setTasks, 
    setTaskModalOpen, 
    deleteTask, 
    getEffectiveStatus,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    assigneeFilter,
    setAssigneeFilter,
    projectFilter,
    setProjectFilter,
    projects,
    taskViewMode,
    setTaskViewMode,
    updateTask,
    user
  } = useTasks();
  const canEdit = user.role !== 'Viewer';
  
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedProjectBoard, setSelectedProjectBoard] = React.useState<string | null>(null);

  // Initialize selectedProjectBoard if null and taskViewMode is 'byProject'
  React.useEffect(() => {
    if (taskViewMode === 'byProject' && !selectedProjectBoard && projects.length > 0) {
      setSelectedProjectBoard(projects[0].name);
    }
  }, [taskViewMode, projects, selectedProjectBoard]);

  const getNormalizedStatus = (status: string) => {
    const normalized = status.toLowerCase().replace(/\s+/g, '-');
    if (normalized === 'done') return 'completed';
    return normalized;
  };

  const currentColumns = columns;

  const getTaskGroupValue = (task: any) => {
    return getNormalizedStatus(getEffectiveStatus(task));
  };

  const getDisplayTasks = () => {
    if (taskViewMode === 'all') return filteredTasks;
    return filteredTasks.filter(t => t.project === selectedProjectBoard);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!canEdit || !destination) return;

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

    // Create a new tasks array with the dragged task updated and moved
    setTasks(prev => {
      const newTasks = [...prev];
      const taskIndex = newTasks.findIndex(t => t.id === draggableId);
      
      if (taskIndex === -1) return prev;

      // Update the task status
      const updatedTask = { ...newTasks[taskIndex], status: newStatus };
      
      // Remove from old position
      newTasks.splice(taskIndex, 1);

      // We need to find the correct insertion point in the global tasks array
      // This is tricky because we're dragging within a filtered/grouped view
      // A simple approach is just to append it or put it at the start,
      // but to maintain relative order we should try to insert it near its new neighbors
      
      const columnTasks = getDisplayTasks().filter(t => getTaskGroupValue(t) === destination.droppableId);
      
      // If moving within same column, we need to handle local Reorder
      if (destination.droppableId === source.droppableId) {
        const otherColumnTasks = getDisplayTasks().filter(t => getTaskGroupValue(t) === destination.droppableId && t.id !== draggableId);
        otherColumnTasks.splice(destination.index, 0, updatedTask);
        
        // Final array: non-column tasks + reordered column tasks
        const nonColumnTasks = prev.filter(t => getTaskGroupValue(t) !== destination.droppableId);
        return [...nonColumnTasks, ...otherColumnTasks];
      } else {
        // Moving to a different column
        const targetColumnTasks = getDisplayTasks().filter(t => getTaskGroupValue(t) === destination.droppableId);
        targetColumnTasks.splice(destination.index, 0, updatedTask);
        
        const otherTasks = prev.filter(t => t.id !== draggableId && getTaskGroupValue(t) !== destination.droppableId);
        return [...otherTasks, ...targetColumnTasks];
      }
    });

    // Also update history/activity if status changed
    if (destination.droppableId !== source.droppableId) {
      updateTask(draggableId, { status: newStatus });
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mr-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Kanban Board</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Sprint 24 • Engineering & Design Synchronization</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-3">
            {users.map((u) => (
              <img key={u.id} src={u.avatar} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900" alt="" />
            ))}
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500">+12</div>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setTaskViewMode('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                taskViewMode === 'all' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm border border-slate-100 dark:border-slate-700" : "text-slate-500 hover:text-slate-700"
              )}
            >
              All
            </button>
            <button 
              onClick={() => setTaskViewMode('byProject')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                taskViewMode === 'byProject' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm border border-slate-100 dark:border-slate-700" : "text-slate-500 hover:text-slate-700"
              )}
            >
              By Project
            </button>
          </div>

          {taskViewMode === 'byProject' && (
            <div className="relative group mr-2">
              <select
                value={selectedProjectBoard || ''}
                onChange={(e) => setSelectedProjectBoard(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-container/20 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none group-hover:text-primary-container transition-colors" />
            </div>
          )}
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            <Icons.Share className="h-3 w-3" />
            <span>Share</span>
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              showFilters || statusFilter.length > 0 || priorityFilter.length > 0 || tagFilter.length > 0 || assigneeFilter.length > 0 || projectFilter.length > 0
                ? "bg-primary-container text-white shadow-lg shadow-primary-container/20" 
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            )}
          >
            <Icons.Tasks className="h-3 w-3" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-20"
          >
            <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
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

              <div className="flex items-end h-full">
                {(statusFilter.length > 0 || priorityFilter.length > 0 || tagFilter.length > 0 || assigneeFilter.length > 0 || projectFilter.length > 0) && (
                  <button 
                    onClick={() => {
                      setPriorityFilter([]);
                      setTagFilter([]);
                      setStatusFilter([]);
                      setAssigneeFilter([]);
                      setProjectFilter([]);
                    }}
                    className="text-[10px] font-black text-slate-400 hover:text-error uppercase tracking-widest transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 space-y-12">
          <div className="flex gap-6 overflow-x-auto pb-10 custom-scrollbar pr-10">
            {currentColumns.filter(c => c.id !== 'backlog').map((column) => (
              <div key={column.id} className="flex-1 min-w-[280px] flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", column.color)} />
                    <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-widest">{column.title}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] font-black rounded-full">
                      {getDisplayTasks().filter(t => getTaskGroupValue(t) === column.id).length || 0}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-primary-container"><Icons.More className="h-4 w-4" /></button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 space-y-4 min-h-[150px] p-2 rounded-2xl border-2 border-transparent transition-colors",
                        snapshot.isDraggingOver ? "bg-slate-100/50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-slate-800" : ""
                      )}
                    >
                      {getDisplayTasks()
                        .filter(t => getTaskGroupValue(t) === column.id)
                        .map((task, i) => (
                          <KanbanCard key={task.id} task={task} index={i} onDelete={() => deleteTask(task.id)} canEdit={canEdit} />
                        ))
                      }
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                
                {canEdit && (
                  <button 
                    onClick={() => setTaskModalOpen(true)}
                    className="w-full py-3 border-2 border-dashed border-slate-100 dark:border-slate-800/40 rounded-2xl text-slate-400 hover:border-primary-container/40 hover:text-primary-container hover:bg-white dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 mt-2 group"
                  >
                    <Icons.Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Task</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Backlog Section Underneath */}
          <div className="mr-10 pb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-3 px-4">
                <Icons.Boards className="h-4 w-4 text-slate-400" />
                <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">Section: Backlog & Ideas</h2>
              </div>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <Droppable droppableId="backlog" direction="horizontal">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[150px] p-2 rounded-3xl border-2 border-transparent transition-colors",
                    snapshot.isDraggingOver ? "bg-slate-100/50 dark:bg-white/[0.02] border-dashed border-slate-200 dark:border-slate-800" : ""
                  )}
                >
                  {getDisplayTasks()
                    .filter(t => getTaskGroupValue(t) === 'backlog')
                    .map((task, i) => (
                      <KanbanCard key={task.id} task={task} index={i} onDelete={() => deleteTask(task.id)} canEdit={canEdit} />
                    ))
                  }
                  {provided.placeholder}
                  
                  {canEdit && (
                    <button 
                      onClick={() => setTaskModalOpen(true)}
                      className="h-[200px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-primary-container/40 hover:text-primary-container hover:bg-white dark:hover:bg-white/5 transition-all group"
                    >
                      <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-900 group-hover:scale-110 transition-transform">
                        <Icons.Plus className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Add to Backlog</span>
                    </button>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export const KanbanCard = (props: any) => {
  const { task, index, onDelete, canEdit } = props;
  const { openTaskDetails, projects, updateTask } = useTasks();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const project = projects.find(p => p.name === task.project);
  
  const completedSubtasks = task.subtasks.filter((s: any) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const commentCount = task.activity.filter((a: any) => a.type === 'comment').length;

  const toggleSubtask = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    if (!canEdit) return;
    
    const updatedSubtasks = task.subtasks.map((s: any) => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    
    const completed = updatedSubtasks.filter((s: any) => s.completed).length;
    const total = updatedSubtasks.length;
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    updateTask(task.id, { 
      subtasks: updatedSubtasks,
      progress: newProgress
    });
  };

  const priorityColors = {
    Urgent: 'text-error',
    High: 'text-amber-500',
    Medium: 'text-indigo-500',
    Low: 'text-slate-400'
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => openTaskDetails(task.id)}
          className={cn(
            "bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all group cursor-pointer relative overflow-hidden active:scale-[0.98]",
            snapshot.isDragging ? "shadow-2xl border-primary-container/40 z-50 ring-2 ring-primary-container/20 scale-[1.02]" : "hover:border-primary-container/40 hover:shadow-xl"
          )}
          style={{ 
            ...provided.draggableProps.style,
            borderTop: project?.color ? `4px solid ${project.color}` : undefined 
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col gap-1.5 w-full">
              {project && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em] py-0.5 px-0">
                    {project.name}
                  </span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-1 text-[9px] font-black uppercase rounded tracking-widest shadow-sm",
                  task.tags[0] === 'engineering' ? "bg-indigo-500/10 text-indigo-500" :
                  task.tags[0] === 'design' ? "bg-emerald-500/10 text-emerald-500" :
                  task.tags[0] === 'marketing' ? "bg-purple-500/10 text-purple-500" :
                  "bg-amber-500/10 text-amber-500"
                )}>
                  {task.tags[0]}
                </span>
                <div className={cn("flex items-center gap-1 text-[9px] font-black uppercase tracking-widest", priorityColors[task.priority as keyof typeof priorityColors])}>
                  <Icons.Priority className="h-3 w-3" />
                  <span>{task.priority}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 absolute top-4 right-4">
              {canEdit && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this task?')) onDelete();
                  }}
                  className="p-1.5 text-slate-400 hover:text-error transition-all relative z-10"
                  title="Delete Task"
                >
                  <Icons.Delete className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 leading-relaxed group-hover:text-primary-container transition-colors uppercase tracking-tight line-clamp-2">
            {task.title}
          </h4>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-normal">
            {task.description}
          </p>
          
          {task.progress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${task.progress}%` }} 
                  className="h-full bg-gradient-to-r from-primary-container to-indigo-400 rounded-full" 
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mb-6 pt-4 border-t border-slate-50 dark:border-slate-800/50">
            {totalSubtasks > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className={cn(
                  "flex items-center gap-1.5 transition-colors group/stat",
                  isExpanded ? "text-primary-container" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )} 
                title={isExpanded ? "Collapse Subtasks" : "Expand Subtasks"}
              >
                <Icons.Subtasks className={cn("h-3 w-3 transition-transform", isExpanded ? "scale-110" : "")} />
                <span className="text-[10px] font-bold">{completedSubtasks}/{totalSubtasks}</span>
                <Icons.ChevronDown className={cn("h-3 w-3 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
              </button>
            )}
            {task.attachments.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-400" title="Attachments">
                <Icons.Clip className="h-3 w-3" />
                <span className="text-[10px] font-bold">{task.attachments.length}</span>
              </div>
            )}
            {commentCount > 0 && (
              <div className="flex items-center gap-1.5 text-slate-400" title="Comments">
                <Icons.Message className="h-3 w-3" />
                <span className="text-[10px] font-bold">{commentCount}</span>
              </div>
            )}
            {task.points && (
              <div className="flex items-center gap-1.5 text-slate-400 ml-auto" title="Points">
                <Icons.Points className="h-3 w-3" />
                <span className="text-[10px] font-bold">{task.points}</span>
              </div>
            )}
          </div>

          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 mb-6 bg-slate-50/50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
              {task.subtasks.map((subtask: any) => (
                <div 
                  key={subtask.id}
                  onClick={(e) => toggleSubtask(e, subtask.id)}
                  className="flex items-center gap-2 group/subtask"
                >
                  <div className={cn(
                    "h-3.5 w-3.5 rounded border flex items-center justify-center transition-all",
                    subtask.completed 
                      ? "bg-emerald-500 border-emerald-500" 
                      : "border-slate-300 dark:border-slate-600 group-hover/subtask:border-primary-container"
                  )}>
                    {subtask.completed && <Icons.Check className="h-2.5 w-2.5 text-white stroke-[4]" />}
                  </div>
                  <span className={cn(
                    "text-[11px] font-medium transition-all truncate",
                    subtask.completed 
                      ? "text-slate-400 line-through" 
                      : "text-slate-600 dark:text-slate-300"
                  )}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Icons.Calendar className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase">{task.dueDate.split(',')[0]}</span>
            </div>
            <div className="flex -space-x-1.5">
              {task.assignees.map((user: any, i: number) => (
                <img key={i} src={user.avatar} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" title={user.name} alt={user.name} />
              ))}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
