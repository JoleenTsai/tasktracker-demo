import React from 'react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { motion } from 'motion/react';

export const ProjectsView = ({ onViewChange }: { onViewChange: (view: string) => void }) => {
  const context = useTasks();
  const { projects, setSelectedProjectId, setProjectModalOpen, user } = context;
  const canEdit = user.role !== 'Viewer';
  const [sortBy, setSortBy] = React.useState<'name' | 'progress' | 'dueDate'>('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  
  const handleProjectClick = (id: string) => {
    setSelectedProjectId(id);
    onViewChange('project-details');
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === 'progress') {
      return sortOrder === 'asc' ? a.progress - b.progress : b.progress - a.progress;
    }
    if (sortBy === 'dueDate') {
      const getDays = (str: string) => {
        const match = str.match(/(\d+)/);
        return match ? parseInt(match[0], 10) : 0;
      };
      const daysA = getDays(a.dueDate);
      const daysB = getDays(b.dueDate);
      return sortOrder === 'asc' ? daysA - daysB : daysB - daysA;
    }
    return 0;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Active Projects</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and track your high-level organizational goals.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <button 
              onClick={() => {
                setSelectedProjectId(null);
                setProjectModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-primary-container text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Icons.Plus className="h-4 w-4" />
              <span>Create Project</span>
            </button>
          )}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => {
                if (sortBy === 'dueDate') {
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('dueDate');
                  setSortOrder('asc');
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                sortBy === 'dueDate' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icons.Calendar className="h-3 w-3" />
              <span>Due Date</span>
              {sortBy === 'dueDate' && (
                sortOrder === 'asc' ? <Icons.ChevronUp className="h-3 w-3" /> : <Icons.ChevronDown className="h-3 w-3" />
              )}
            </button>
            <button 
              onClick={() => {
                if (sortBy === 'progress') {
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('progress');
                  setSortOrder('asc');
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                sortBy === 'progress' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icons.TrendingUp className="h-3 w-3" />
              <span>Progress</span>
              {sortBy === 'progress' && (
                sortOrder === 'asc' ? <Icons.ChevronUp className="h-3 w-3" /> : <Icons.ChevronDown className="h-3 w-3" />
              )}
            </button>
            <button 
              onClick={() => {
                if (sortBy === 'name') {
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('name');
                  setSortOrder('asc');
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                sortBy === 'name' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icons.User className="h-3 w-3" />
              <span>Name</span>
              {sortBy === 'name' && (
                sortOrder === 'asc' ? <Icons.ChevronUp className="h-3 w-3" /> : <Icons.ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

          <button 
            onClick={() => {
              setSelectedProjectId(null);
              setProjectModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary-container text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Icons.Plus className="h-4 w-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProjects.map((project, i) => (
          <ProjectDetailCard 
            key={project.id} 
            project={project} 
            index={i} 
            context={context}
            onClick={() => handleProjectClick(project.id)} 
          />
        ))}
        
        {canEdit && (
          <button 
            onClick={() => {
              setSelectedProjectId(null);
              setProjectModalOpen(true);
            }}
            className="h-[280px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-primary-container/40 hover:text-primary-container hover:bg-white dark:hover:bg-white/5 transition-all group"
          >
            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-900 group-hover:scale-110 transition-transform">
              <Icons.Plus className="h-8 w-8" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest">New Project</span>
          </button>
        )}
      </div>
    </div>
  );
};

const ProjectDetailCard = (props: any) => {
  const { project, index, onClick } = props;
  const Icon = Icons[project.icon as keyof typeof Icons] || Icons.Boards;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary-container/30 transition-all group cursor-pointer relative overflow-hidden"
      style={{ borderTop: project.color ? `4px solid ${project.color}` : undefined }}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-primary-container border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform shadow-sm" style={{ color: project.color }}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
          <span className="text-xs font-black text-slate-900 dark:text-white mt-1 uppercase">{project.dueDate} LEFT</span>
        </div>
      </div>

      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-primary-container transition-colors uppercase tracking-tight">{project.name}</h3>
      <p className="text-xs text-slate-500 font-medium mb-3">{project.phase}</p>
      
      {project.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-4 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}

      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {project.tags.map((tag: string, i: number) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-1">{project.progress}%</span>
          </div>
          <div className="flex -space-x-2">
            {project.team.map((user: any, i: number) => (
              <img key={i} src={user.avatar} className="h-7 w-7 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" alt="" />
            ))}
          </div>
        </div>

        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${project.progress}%` }} 
            className="h-full bg-gradient-to-r from-primary-container to-indigo-400 rounded-full" 
            style={{ backgroundColor: project.color, backgroundImage: 'none' }}
          />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            "w-2 h-2 rounded-full",
            project.category === 'Design' ? "bg-emerald-500" : "bg-indigo-500"
          )} />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{project.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const { setSelectedProjectId, setProjectModalOpen } = props.context;
              setSelectedProjectId(project.id);
              setProjectModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-primary-container hover:bg-primary-container/10 rounded-lg transition-all"
            title="Edit Project"
          >
            <Icons.Edit className="h-4 w-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 rounded-lg transition-all">
            <Icons.More className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
