/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { TasksList } from './components/TasksList';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailsView } from './components/ProjectDetailsView';
import { AccountSettings } from './components/AccountSettings';
import { RecentlyDeletedView } from './components/RecentlyDeletedView';
import { CalendarView } from './components/CalendarView';
import { EngagementsView } from './components/EngagementsView';
import { PersonalChecklistView } from './components/PersonalChecklistView';
import { GlobalInviteModal } from './components/GlobalInviteModal';
import { useTheme } from './hooks/useTheme';
import { TaskProvider } from './contexts/TaskContext';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check auth status on load
  useEffect(() => {
    fetch('/api/auth/google/status')
      .then(res => res.json())
      .then(data => setIsAuthenticated(data.isAuthenticated))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onViewChange={setActiveView} />;
      case 'tasks':
        return <TasksList />;
      case 'boards':
        return <KanbanBoard />;
      case 'calendar':
        return <CalendarView />;
      case 'checklist':
        return <PersonalChecklistView />;
      case 'engagements':
        return <EngagementsView />;
      case 'projects':
        return <ProjectsView onViewChange={setActiveView} />;
      case 'project-details':
        return <ProjectDetailsView onViewChange={setActiveView} />;
      case 'settings':
        return <AccountSettings />;
      case 'trash':
        return <RecentlyDeletedView />;
      default:
        return <Dashboard onViewChange={setActiveView} />;
    }
  };

  // Show loading screen while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <TaskProvider>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Sidebar 
          activeView={activeView} 
          onViewChange={setActiveView} 
          theme={theme} 
          onToggleTheme={toggleTheme} 
        />
        
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <TopBar />
          
          <main className="flex-1 p-8 overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="max-w-[1400px] mx-auto"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <CreateTaskModal />
        <CreateProjectModal />
        <TaskDetailsModal />
        <GlobalInviteModal />
      </div>
    </TaskProvider>
  );
}
