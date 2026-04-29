import React from 'react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';

export const TopBar = () => {
  const { searchQuery, setSearchQuery, user } = useTasks();
  
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm font-manrope">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search tasks, teams, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border-none bg-slate-100 dark:bg-slate-900/50 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-300 focus:ring-2 focus:ring-primary-container/20 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all relative">
          <Icons.Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-error rounded-full border-2 border-white dark:border-slate-950" />
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all">
          <Icons.Help className="h-5 w-5" />
        </button>
        
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
        
        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">{user.role}</p>
          </div>
          <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm group-hover:border-primary-container/50 transition-all">
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};
