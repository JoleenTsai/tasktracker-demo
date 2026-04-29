export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type Status = 'To Do' | 'In Progress' | 'In Review' | 'Completed' | 'Backlog' | 'Blocked';

export interface UserPreferences {
  calendarSync: boolean;
  reminders: boolean;
  notifications: boolean;
  cadence: { label: string; value: number; unit: string }[];
}

export interface User {
  id: string;
  name: string;
  role: 'Viewer' | 'Contributor' | 'Manager' | 'Admin';
  avatar: string;
  email: string;
  preferences?: UserPreferences;
  status?: 'Active' | 'Invited' | 'Deactivated';
}

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  assignees: User[];
  dueDate?: string;
  linkedTaskId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'doc' | 'link';
  url: string;
  createdAt?: string;
}

export interface ActivityItem {
  id: string;
  type: 'comment' | 'status_change' | 'priority_change' | 'upload';
  user: User;
  timestamp: string;
  createdAt: number;
  content?: string;
  oldValue?: string;
  newValue?: string;
  attachments?: Attachment[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  priority: Priority;
  status: Status;
  assignees: User[];
  reporter: User;
  dueDate: string;
  createdAt: string;
  tags: string[];
  subtasks: Subtask[];
  attachments: Attachment[];
  activity: ActivityItem[];
  progress: number;
  points: number;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  phase: string;
  status: string;
  progress: number;
  team: User[];
  dueDate: string;
  icon: string;
  category: string;
  color?: string;
  tags: string[];
  attachments: Attachment[];
  notes?: string;
}

export interface PersonalTodo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  priority: Priority;
  dueDate?: string;
}

export type EngagementStatus = 'Active' | 'On Hold' | 'Completed' | 'Upcoming' | 'Cancelled';
export type EngagementCadence = 'One-time' | 'Recurring';

export interface Engagement {
  id: string;
  title: string;
  clientContact: User;
  accountLead: User;
  engagementDate: string;
  status: EngagementStatus;
  priority: Priority;
  cadence: EngagementCadence;
  recurrencePattern?: string;
  stakeholders: User[];
  description?: string;
  tasks?: Subtask[];
  attachments?: Attachment[];
  createdAt: string;
}
