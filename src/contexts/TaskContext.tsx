import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task, Project, User, Attachment, Engagement, PersonalTodo, ActivityItem } from '../types';
import { mockTasks, mockProjects, currentUser, mockEngagements, users } from '../constants';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  engagements: Engagement[];
  personalTodos: PersonalTodo[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'activity' | 'progress'>) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  addEngagement: (engagement: Omit<Engagement, 'id' | 'createdAt'>) => void;
  addPersonalTodo: (todo: Omit<PersonalTodo, 'id' | 'createdAt' | 'completed'>) => void;
  togglePersonalTodo: (id: string) => void;
  deletePersonalTodo: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  updateEngagementStatus: (id: string, status: Engagement['status']) => void;
  updateEngagement: (id: string, updates: Partial<Engagement>) => void;
  deleteEngagement: (id: string) => void;
  toggleEngagementTask: (engagementId: string, taskId: string) => void;
  addEngagementAttachment: (engagementId: string, attachment: Attachment) => void;
  removeEngagementAttachment: (engagementId: string, attachmentId: string) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteTask: (taskId: string) => void;
  restoreTask: (taskId: string) => void;
  permanentlyDeleteTask: (taskId: string) => void;
  addTaskComment: (taskId: string, content: string) => void;
  deletedTasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addAttachmentToTask: (taskId: string, attachment: Omit<Attachment, 'id'>) => void;
  addAttachmentToProject: (projectId: string, attachment: Omit<Attachment, 'id'>) => void;
  inviteToProject: (projectId: string, email: string, role?: User['role']) => void;
  inviteToOrg: (email: string, role: User['role']) => void;
  teamMembers: User[];
  updateMemberRole: (userId: string, newRole: User['role']) => void;
  removeMember: (userId: string) => void;
  deleteProject: (projectId: string) => void;
  inviteToTeamOpen: boolean;
  setInviteToTeamOpen: (open: boolean) => void;
  pendingUpdates: Record<string, any>;
  setPendingUpdates: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  getEffectiveStatus: (task: Task) => Task['status'];
  getTaskValue: (task: Task, field: string) => any;
  isTaskModalOpen: boolean;
  setTaskModalOpen: (open: boolean) => void;
  isTaskDetailsOpen: boolean;
  setTaskDetailsOpen: (open: boolean) => void;
  isProjectModalOpen: boolean;
  setProjectModalOpen: (open: boolean) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  openTaskDetails: (taskId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string[];
  setStatusFilter: (statuses: string[]) => void;
  priorityFilter: string[];
  setPriorityFilter: (priorities: string[]) => void;
  tagFilter: string[];
  setTagFilter: (tags: string[]) => void;
  assigneeFilter: string[];
  setAssigneeFilter: (userIds: string[]) => void;
  projectFilter: string[];
  setProjectFilter: (projects: string[]) => void;
  taskViewMode: 'all' | 'byProject';
  setTaskViewMode: (mode: 'all' | 'byProject') => void;
  filteredTasks: Task[];
  orgSettings: {
    categories: string[];
    statuses: string[];
    phases: string[];
  };
  updateOrgSettings: (settings: Partial<{ categories: string[]; statuses: string[]; phases: string[] }>) => void;
  addOrgCategory: (category: string) => void;
  addOrgStatus: (status: string) => void;
  addOrgPhase: (phase: string) => void;
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [engagements, setEngagements] = useState<Engagement[]>(mockEngagements);
  const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>([
    { id: 'pt-1', title: 'Prepare for Q4 Planning', completed: false, createdAt: '2 days ago', priority: 'High' },
    { id: 'pt-2', title: 'Review team feedback', completed: true, createdAt: '3 days ago', priority: 'Medium' },
  ]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [inviteToTeamOpen, setInviteToTeamOpen] = useState(false);
  const [isTaskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, any>>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [taskViewMode, setTaskViewMode] = useState<'all' | 'byProject'>('all');
  const [user, setUser] = useState<User>(currentUser);
  const [teamMembers, setTeamMembers] = useState<User[]>(users);

  const [orgSettings, setOrgSettings] = useState({
    categories: ['Design', 'Development', 'Marketing', 'Infrastructure'],
    statuses: ['Draft', 'Active', 'On Hold', 'Completed', 'Archived'],
    phases: ['Discovery', 'Planning', 'Execution', 'Testing', 'Launch']
  });

  const updateOrgSettings = (settings: Partial<{ categories: string[]; statuses: string[]; phases: string[] }>) => {
    setOrgSettings(prev => ({ ...prev, ...settings }));
  };

  const addOrgCategory = (category: string) => {
    setOrgSettings(prev => {
      if (prev.categories.includes(category)) return prev;
      return { ...prev, categories: [...prev.categories, category] };
    });
  };

  const addOrgStatus = (status: string) => {
    setOrgSettings(prev => {
      if (prev.statuses.includes(status)) return prev;
      return { ...prev, statuses: [...prev.statuses, status] };
    });
  };

  const addOrgPhase = (phase: string) => {
    setOrgSettings(prev => {
      if (prev.phases.includes(phase)) return prev;
      return { ...prev, phases: [...prev.phases, phase] };
    });
  };

  const getEffectiveStatus = (task: Task) => {
    return pendingUpdates[task.id]?.status ?? task.status;
  };

  const getTaskValue = (task: Task, field: string) => {
    return pendingUpdates[task.id]?.[field] ?? (task as any)[field];
  };

  const openTaskDetails = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDetailsOpen(true);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'activity' | 'progress'>) => {
    const newTask: Task = {
      ...taskData,
      id: `TT-${Math.floor(Math.random() * 1000)}`,
      createdAt: 'Just now',
      progress: 0,
      subtasks: taskData.subtasks || [],
      activity: [
        {
          id: `ac-${Date.now()}`,
          type: 'status_change',
          user: user,
          timestamp: 'Just now',
          createdAt: Date.now(),
          oldValue: 'None',
          newValue: taskData.status
        }
      ],
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const addProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...projectData,
      id: `p-${Math.floor(Math.random() * 1000)}`,
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newActivity: ActivityItem = {
          id: `ac-${Date.now()}`,
          type: 'status_change',
          user: user,
          timestamp: 'Just now',
          createdAt: Date.now(),
          oldValue: t.status,
          newValue: status
        };
        return { ...t, status, activity: [newActivity, ...t.activity] };
      }
      return t;
    }));
    // Clear pending for this task as it's now updated globally
    clearTaskPending(taskId);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let newActivity = [...t.activity];
        
        if (updates.status && updates.status !== t.status) {
          newActivity.unshift({
            id: `ac-${Date.now()}-status`,
            type: 'status_change',
            user: user,
            timestamp: 'Just now',
            createdAt: Date.now(),
            oldValue: t.status,
            newValue: updates.status
          });
        }
        
        if (updates.priority && updates.priority !== t.priority) {
          newActivity.unshift({
            id: `ac-${Date.now()}-priority`,
            type: 'priority_change',
            user: user,
            timestamp: 'Just now',
            createdAt: Date.now(),
            oldValue: t.priority,
            newValue: updates.priority
          });
        }

        return { ...t, ...updates, activity: newActivity };
      }
      return t;
    }));
    // Clear pending for this task as it's now updated globally
    clearTaskPending(taskId);
  };

  const addTaskComment = (taskId: string, content: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newActivity: ActivityItem = {
          id: `ac-${Date.now()}-comment`,
          type: 'comment',
          user: user,
          timestamp: 'Just now',
          createdAt: Date.now(),
          content: content
        };
        return { ...t, activity: [newActivity, ...t.activity] };
      }
      return t;
    }));
  };

  const clearTaskPending = (taskId: string) => {
    setPendingUpdates(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const deleteTask = (taskId: string) => {
    // 1. Find the task to delete
    const taskToDelete = tasks.find(t => t.id === taskId);
    
    if (taskToDelete) {
      // 2. Remove from main tasks list
      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      // 3. Add to the recycle bin (deletedTasks)
      setDeletedTasks(prev => [{ 
        ...taskToDelete, 
        isDeleted: true, 
        deletedAt: new Date().toLocaleString() 
      }, ...prev]);
      
      // 4. Clear any pending edits
      setPendingUpdates(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });

      // 5. Close detail pane if this task was being viewed
      if (selectedTaskId === taskId) {
        setTaskDetailsOpen(false);
        setSelectedTaskId(null);
      }
    }
  };

  const restoreTask = (taskId: string) => {
    setDeletedTasks(prevDeleted => {
      const taskToRestore = prevDeleted.find(t => t.id === taskId);
      if (taskToRestore) {
        setTasks(prevTasks => [{ ...taskToRestore, isDeleted: false, deletedAt: undefined }, ...prevTasks]);
        return prevDeleted.filter(t => t.id !== taskId);
      }
      return prevDeleted;
    });
  };

  const permanentlyDeleteTask = (taskId: string) => {
    setDeletedTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(getEffectiveStatus(task));
    const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(task.priority);
    const matchesTag = tagFilter.length === 0 || task.tags.some(tag => tagFilter.includes(tag.toLowerCase()));
    const matchesAssignee = assigneeFilter.length === 0 || task.assignees.some(u => assigneeFilter.includes(u.id));
    const matchesProject = projectFilter.length === 0 || projectFilter.includes(task.project);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesTag && matchesAssignee && matchesProject;
  });

  const addAttachmentToTask = (taskId: string, attachment: Omit<Attachment, 'id'>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { 
        ...task, 
        attachments: [...task.attachments, { ...attachment, id: `att-${Date.now()}` }] 
      } : task
    ));
  };

  const addAttachmentToProject = (projectId: string, attachment: Omit<Attachment, 'id'>) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId ? { 
        ...project, 
        attachments: [...project.attachments, { ...attachment, id: `att-p-${Date.now()}` }] 
      } : project
    ));
  };

  const inviteToProject = (projectId: string, email: string, role: User['role'] = 'Viewer') => {
    // Simulate finding a user by email
    const name = email.split('@')[0];
    const newUser: User = {
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: email,
      role: role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      status: 'Invited'
    };

    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, team: [...p.team, newUser] } : p
    ));
    
    // Also add to org-wide team if not there
    setTeamMembers(prev => {
      if (prev.some(u => u.email === email)) return prev;
      return [...prev, newUser];
    });
  };

  const inviteToOrg = (email: string, role: User['role']) => {
    const name = email.split('@')[0];
    const newUser: User = {
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: email,
      role: role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      status: 'Invited'
    };
    setTeamMembers(prev => [...prev, newUser]);
  };

  const updateMemberRole = (userId: string, newRole: User['role']) => {
    setTeamMembers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    // Also update in projects
    setProjects(prev => prev.map(p => ({
      ...p,
      team: p.team.map(u => u.id === userId ? { ...u, role: newRole } : u)
    })));

    // Update current user if it's them
    if (user.id === userId) {
      setUser(prev => ({ ...prev, role: newRole }));
    }
  };

  const removeMember = (userId: string) => {
    const memberToRemove = teamMembers.find(u => u.id === userId);
    if (memberToRemove?.role === 'Admin') {
      alert('Administrators cannot be removed from the organization.');
      return;
    }
    
    setTeamMembers(prev => prev.filter(u => u.id !== userId));
    setProjects(prev => prev.map(p => ({
      ...p,
      team: p.team.filter(u => u.id !== userId)
    })));
  };

  const deleteProject = (projectId: string) => {
    if (user.role !== 'Admin' && user.role !== 'Manager') {
      alert('Only Managers and Admins can delete projects.');
      return;
    }
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setSelectedProjectId(null);
  };

  const addEngagement = (engagementData: Omit<Engagement, 'id' | 'createdAt'>) => {
    const newEngagement: Engagement = {
      ...engagementData,
      id: `en-${Date.now()}`,
      createdAt: 'Just now'
    };
    setEngagements(prev => [newEngagement, ...prev]);
  };

  const addPersonalTodo = (todoData: Omit<PersonalTodo, 'id' | 'createdAt' | 'completed'>) => {
    const newTodo: PersonalTodo = {
      ...todoData,
      id: `pt-${Date.now()}`,
      completed: false,
      createdAt: 'Just now'
    };
    setPersonalTodos(prev => [newTodo, ...prev]);
  };

  const togglePersonalTodo = (id: string) => {
    setPersonalTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deletePersonalTodo = (id: string) => {
    setPersonalTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        
        // Calculate new progress based on subtasks
        const completedCount = updatedSubtasks.filter(st => st.completed).length;
        const progress = updatedSubtasks.length > 0 
          ? Math.round((completedCount / updatedSubtasks.length) * 100) 
          : task.progress;

        return { ...task, subtasks: updatedSubtasks, progress };
      }
      return task;
    }));
  };

  const updateEngagementStatus = (id: string, status: Engagement['status']) => {
    setEngagements(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const updateEngagement = (id: string, updates: Partial<Engagement>) => {
    setEngagements(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEngagement = (id: string) => {
    setEngagements(prev => prev.filter(e => e.id !== id));
  };

  const toggleEngagementTask = (engagementId: string, taskId: string) => {
    setEngagements(prev => prev.map(e => {
      if (e.id === engagementId && e.tasks) {
        return {
          ...e,
          tasks: e.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return e;
    }));
  };

  const addEngagementAttachment = (engagementId: string, attachment: Attachment) => {
    setEngagements(prev => prev.map(e => 
      e.id === engagementId 
        ? { ...e, attachments: [...(e.attachments || []), attachment] }
        : e
    ));
  };

  const removeEngagementAttachment = (engagementId: string, attachmentId: string) => {
    setEngagements(prev => prev.map(e => 
      e.id === engagementId 
        ? { ...e, attachments: (e.attachments || []).filter(a => a.id !== attachmentId) }
        : e
    ));
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      projects, 
      engagements,
      personalTodos,
      addTask, 
      addProject, 
      addEngagement,
      addPersonalTodo,
      togglePersonalTodo,
      deletePersonalTodo,
      toggleSubtask,
      updateEngagementStatus,
      updateEngagement,
      deleteEngagement,
      toggleEngagementTask,
      addEngagementAttachment,
      removeEngagementAttachment,
      updateTaskStatus, 
      updateTask,
      addTaskComment,
      updateProject,
      deleteTask,
      restoreTask,
      permanentlyDeleteTask,
      deletedTasks,
      setTasks,
      addAttachmentToTask,
      addAttachmentToProject,
      inviteToProject,
      inviteToOrg,
      teamMembers,
      updateMemberRole,
      removeMember,
      deleteProject,
      inviteToTeamOpen,
      setInviteToTeamOpen,
      pendingUpdates,
      setPendingUpdates,
      getEffectiveStatus,
      getTaskValue,
      isTaskModalOpen, 
      setTaskModalOpen,
      isProjectModalOpen,
      setProjectModalOpen,
      isTaskDetailsOpen,
      setTaskDetailsOpen,
      selectedTaskId,
      setSelectedTaskId,
      selectedProjectId,
      setSelectedProjectId,
      openTaskDetails,
      searchQuery,
      setSearchQuery,
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
      taskViewMode,
      setTaskViewMode,
      filteredTasks,
      orgSettings,
      updateOrgSettings,
      addOrgCategory,
      addOrgStatus,
      addOrgPhase,
      user,
      updateUser
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
