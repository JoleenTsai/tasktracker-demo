import { Project, Task, User } from './types';

export const currentUser: User = {
  id: 'u1',
  name: 'Joleen Leonard',
  role: 'Admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joleen',
  email: 'joleen@teamtask.com',
  status: 'Active',
  preferences: {
    calendarSync: true,
    reminders: true,
    notifications: true,
    cadence: [
      { label: '1st Alert', value: 7, unit: 'days' },
      { label: '2nd Alert', value: 3, unit: 'days' }
    ]
  }
};

export const users: User[] = [
  currentUser,
  {
    id: 'u2',
    name: 'Marcus Chen',
    role: 'Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    email: 'marcus@teamtask.com',
    status: 'Active'
  },
  {
    id: 'u3',
    name: 'Sarah Miller',
    role: 'Contributor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    email: 'sarah@teamtask.com',
    status: 'Active'
  },
  {
    id: 'u4',
    name: 'Alex Rivera',
    role: 'Viewer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    email: 'alex@teamtask.com',
    status: 'Invited'
  }
];

export const mockTasks: Task[] = [
  {
    id: 'TT-842',
    title: 'Q4 Content Strategy Refinement',
    description: 'Refine the quarterly content strategy to align with the new brand pillars established in September. The primary focus should be on high-impact thought leadership pieces and technical deep-dives for the mid-market segment.',
    project: 'Phoenix Redesign',
    priority: 'Urgent',
    status: 'In Review',
    assignees: [users[1]],
    reporter: users[2],
    dueDate: 'Apr 24, 2026',
    createdAt: '2 days ago',
    tags: ['strategy', 'q4-goals', 'content'],
    progress: 50,
    points: 13,
    subtasks: [
      { id: 's1', title: 'Audit current Q3 performance metrics', completed: true, assignees: [users[3]], dueDate: 'Apr 20, 2026' },
      { id: 's2', title: 'Draft outline for "Modern Workflow" series', completed: true, assignees: [users[2]], dueDate: 'Apr 21, 2026' },
      { id: 's3', title: 'Review budget with Finance team', completed: false, assignees: [users[1]], dueDate: 'Apr 22, 2026' },
      { id: 's4', title: 'Finalize editorial calendar', completed: false, assignees: [], dueDate: 'Apr 23, 2026' }
    ],
    attachments: [
      { id: 'a1', name: 'q3_performance.png', type: 'image', url: 'https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=300' },
      { id: 'a2', name: 'strategy_draft_v2.pdf', type: 'pdf', url: 'https://images.unsplash.com/photo-1454165833762-02c462066824?auto=format&fit=crop&q=80&w=300' }
    ],
    activity: [
      {
        id: 'ac1',
        type: 'comment',
        user: users[1],
        timestamp: '2 hours ago',
        createdAt: Date.now() - 2 * 60 * 60 * 1000,
        content: "I've uploaded the latest SEO metrics. We need to focus more on the 'Cloud Infrastructure' cluster as per the new guidelines."
      },
      {
        id: 'ac2',
        type: 'status_change',
        user: { id: 'system', name: 'System', role: 'Viewer', avatar: '', email: '' },
        timestamp: '5 hours ago',
        createdAt: Date.now() - 5 * 60 * 60 * 1000,
        oldValue: 'In Progress',
        newValue: 'In Review'
      }
    ]
  },
  {
    id: 'TT-204',
    title: 'Implement Auth Flow',
    description: 'Create a robust authentication and authorization system using OAuth2 and JWT.',
    project: 'Data Migration',
    priority: 'High',
    status: 'In Progress',
    assignees: [users[3]],
    reporter: currentUser,
    dueDate: 'Apr 24, 2026',
    createdAt: '5 days ago',
    tags: ['engineering', 'security'],
    progress: 35,
    points: 8,
    subtasks: [],
    attachments: [],
    activity: [],
  },
  {
    id: 'TT-105',
    title: 'Design System Audit',
    description: 'Review existing components and ensure consistency with the new brand guidelines.',
    project: 'Phoenix Redesign',
    priority: 'Medium',
    status: 'Backlog',
    assignees: [users[3]],
    reporter: currentUser,
    dueDate: 'Apr 26, 2026',
    createdAt: '1 week ago',
    tags: ['design', 'audit'],
    progress: 0,
    points: 5,
    subtasks: [],
    attachments: [],
    activity: [],
  },
  {
    id: 'TT-301',
    title: 'Mobile Responsive Fixes',
    description: 'Ensure the navigation bar and footer are fully responsive on mobile devices (iOS/Android).',
    project: 'Phoenix Redesign',
    priority: 'High',
    status: 'To Do',
    assignees: [users[3], users[0]],
    reporter: users[2],
    dueDate: 'Apr 28, 2026',
    createdAt: '1 day ago',
    tags: ['engineering', 'ux'],
    progress: 0,
    points: 3,
    subtasks: [
      { id: 's301-1', title: 'Test on iPhone 13', completed: false, assignees: [], dueDate: 'Apr 27, 2026' }
    ],
    attachments: [],
    activity: [
      { 
        id: 'ac301-1', 
        type: 'comment', 
        user: users[3], 
        timestamp: '1 hour ago', 
        createdAt: Date.now() - 1 * 60 * 60 * 1000,
        content: 'Testing layout on Safari mobile now.' 
      }
    ],
  },
  {
    id: 'TT-402',
    title: 'Blocked: Database Schema Migration',
    description: 'Migration is on hold until the security review is completed by the Infrastructure team.',
    project: 'Data Migration',
    priority: 'Urgent',
    status: 'Blocked',
    assignees: [users[3]],
    reporter: users[3],
    dueDate: 'Apr 22, 2026', // Past due
    createdAt: '3 days ago',
    tags: ['infrastructure', 'database'],
    progress: 10,
    points: 13,
    subtasks: [],
    attachments: [],
    activity: [],
  },
  {
    id: 'TT-505',
    title: 'Finalize Pricing Page',
    description: 'The pricing table needs final approval from the revenue growth team.',
    project: 'Phoenix Redesign',
    priority: 'Medium',
    status: 'In Review',
    assignees: [users[1]],
    reporter: users[2],
    dueDate: 'Apr 25, 2026',
    createdAt: '2 days ago',
    tags: ['marketing', 'product'],
    progress: 90,
    points: 5,
    subtasks: [],
    attachments: [],
    activity: [],
  }
];

export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Phoenix Redesign',
    description: 'A comprehensive overhaul of the Phoenix platform user interface and experience, focusing on modern aesthetics and streamlined workflows.',
    phase: 'Design System Phase',
    progress: 65,
    team: [users[2], users[3]],
    dueDate: '4 days',
    icon: 'rocket_launch',
    category: 'Design',
    status: 'Active',
    color: '#ec4899', // pink-500
    tags: ['branding', 'ui-ux', 'modernization'],
    attachments: [],
    notes: 'This project is part of our Q4 expansion. Ensure all assets follow the updated brand guidelines.'
  },
  {
    id: 'p2',
    name: 'Data Migration',
    description: 'Moving our legacy on-premise data stacks to a decentralized cloud-native infrastructure with zero-downtime objectives.',
    phase: 'Cloud Infrastructure',
    status: 'In Progress',
    progress: 22,
    team: [users[1]],
    dueDate: '12 days',
    icon: 'database',
    category: 'Development',
    color: '#6366f1', // indigo-500
    tags: ['cloud', 'security', 'migration'],
    attachments: [],
    notes: 'Focus on zero-downtime migration strategy. Security audit required before production move.'
  }
];

export const mockEngagements: any[] = [
  {
    id: 'en1',
    title: 'Content Strategy Alignment',
    clientContact: users[1],
    accountLead: currentUser,
    engagementDate: 'Apr 29, 2026',
    status: 'Upcoming',
    priority: 'High',
    cadence: 'Recurring',
    recurrencePattern: 'Weekly on Wednesdays',
    stakeholders: [users[2], users[3]],
    description: 'Discuss the alignment of the new brand pillars with the Q4 content strategy.',
    tasks: [
      { id: 'en1-t1', title: 'Review brand pillar document', completed: true, assignees: [] },
      { id: 'en1-t2', title: 'Draft content themes list', completed: false, assignees: [] },
      { id: 'en1-t3', title: 'Schedule follow-up with marketing', completed: false, assignees: [] }
    ],
    attachments: [
      { id: 'att-en1-1', name: 'Brand Guidelines', url: 'https://docs.google.com/document/d/1example', type: 'doc', createdAt: '1 day ago' },
      { id: 'att-en1-2', name: 'Q4 Strategy Draft', url: 'https://docs.google.com/presentation/d/1example', type: 'doc', createdAt: '1 day ago' }
    ],
    createdAt: '1 day ago'
  },
  {
    id: 'en2',
    title: 'Auth Flow Review',
    clientContact: users[3],
    accountLead: currentUser,
    engagementDate: 'Apr 30, 2026',
    status: 'Active',
    priority: 'Urgent',
    cadence: 'One-time',
    stakeholders: [users[3]],
    description: 'Technical review of the new authentication system implementation.',
    tasks: [
      { id: 'en2-t1', title: 'Verify JWT implementation', completed: true, assignees: [] },
      { id: 'en2-t2', title: 'Perform load test on Auth service', completed: false, assignees: [] }
    ],
    createdAt: '2 hours ago'
  },
  {
    id: 'en3',
    title: 'Design Audit Sync',
    clientContact: users[3],
    accountLead: currentUser,
    engagementDate: 'May 1, 2026',
    status: 'Upcoming',
    priority: 'Medium',
    cadence: 'Recurring',
    recurrencePattern: 'Bi-weekly on Fridays',
    stakeholders: [users[1]],
    description: 'Quick sync on the progress of the design system audit.',
    tasks: [
      { id: 'en3-t1', title: 'Collect feedback from Sarah', completed: false, assignees: [] }
    ],
    createdAt: '5 hours ago'
  }
];
