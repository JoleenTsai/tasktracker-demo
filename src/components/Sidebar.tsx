import React from 'react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';

interface NavItemProps {
  icon: keyof typeof Icons;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => {
  const Icon = Icons[icon];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-sm font-semibold mb-1",
        active
          ? "bg-primary-container/10 text-primary-container border-r-2 border-primary-container dark:text-primary"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
      )}
    >
      <Icon className={cn("h-4 w-4", active && "animate-pulse")} />
      <span>{label}</span>
    </button>
  );
};

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Sidebar = ({ activeView, onViewChange, theme, onToggleTheme }: SidebarProps) => {
  const { setTaskModalOpen, setProjectModalOpen, setInviteToTeamOpen, user } = useTasks();
  const canEdit = user.role !== 'Viewer';
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl flex flex-col py-6 px-4 z-50">
      <div className="px-4 mb-10 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
          <Icons.Boards className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none">TeamTask</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Productivity Suite</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="space-y-1">
          <NavItem icon="Dashboard" label="Dashboard" active={activeView === 'dashboard'} onClick={() => onViewChange('dashboard')} />
          <NavItem icon="Projects" label="Projects" active={activeView === 'projects'} onClick={() => onViewChange('projects')} />
          <NavItem icon="Tasks" label="Tasks" active={activeView === 'tasks'} onClick={() => onViewChange('tasks')} />
          <NavItem icon="Boards" label="Boards" active={activeView === 'boards'} onClick={() => onViewChange('boards')} />
          <NavItem icon="Check" label="My Checklist" active={activeView === 'checklist'} onClick={() => onViewChange('checklist')} />
          <NavItem icon="Calendar" label="Calendar" active={activeView === 'calendar'} onClick={() => onViewChange('calendar')} />
          <NavItem icon="Users" label="Account Engagements" active={activeView === 'engagements'} onClick={() => onViewChange('engagements')} />
          <NavItem icon="Delete" label="Recently Deleted" active={activeView === 'trash'} onClick={() => onViewChange('trash')} />
        </div>
        
        <div className="mt-8 px-4 space-y-3">
          {canEdit && (
            <>
              <button 
                onClick={() => setTaskModalOpen(true)}
                className="w-full bg-primary-container hover:bg-primary-container/90 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-primary-container/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Icons.Plus className="h-4 w-4" />
                <span>New Task</span>
              </button>
              <button 
                onClick={() => setProjectModalOpen(true)}
                className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl py-3 text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10"
              >
                <Icons.Folder className="h-4 w-4" />
                <span>New Project</span>
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <button
          onClick={onToggleTheme}
          className="flex w-full items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
        >
          {theme === 'light' ? <Icons.Moon className="h-4 w-4" /> : <Icons.Sun className="h-4 w-4" />}
          <span className="text-sm font-semibold">{theme === 'light' ? 'Night Mode' : 'Light Mode'}</span>
        </button>
        <NavItem icon="Settings" label="Settings" active={activeView === 'settings'} onClick={() => onViewChange('settings')} />
        <NavItem icon="Help" label="Help" active={activeView === 'help'} onClick={() => onViewChange('help')} />
        <button 
          onClick={async () => {
            await fetch('/api/auth/google/logout', { method: 'POST' });
            window.location.reload();
          }}
          className="flex w-full items-center gap-3 px-4 py-2 text-error hover:bg-error/5 rounded-lg transition-all mt-2"
        >
          <Icons.LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  );
};
