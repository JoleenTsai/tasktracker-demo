import { LayoutDashboard, CheckCircle2, Kanban, Folder, Plus, Sun, Moon, Settings, User, HelpCircle, LogOut, Search, Bell, Share2, MoreHorizontal, FileText, Image, FileCode, Download, ExternalLink, Calendar, Users, ChevronUp, ChevronDown, GripVertical, Check, ArrowRight, Link, Trash2, Pencil, MessageSquare, Paperclip, ListTodo, AlertCircle, TrendingUp, Loader2, AtSign, HelpCircle as HelpIcon, RefreshCw, Shield, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Icons = {
  Dashboard: LayoutDashboard,
  Tasks: CheckCircle2,
  Boards: Kanban,
  Board: Kanban,
  Projects: Folder,
  Folder,
  Plus,
  ArrowRight,
  Sun,
  Moon,
  Settings,
  User,
  At: AtSign,
  Group: Users,
  Help: HelpCircle,
  HelpCircle,
  CheckCircle2,
  LogOut,
  Search,
  Bell,
  Share: Share2,
  More: MoreHorizontal,
  File: FileText,
  FileText,
  Image,
  Code: FileCode,
  Download,
  ExternalLink,
  Expand: ExternalLink,
  Calendar,
  Users,
  ChevronUp,
  ChevronDown,
  Grip: GripVertical,
  Check,
  Link,
  Loader2,
  Delete: Trash2,
  Edit: Pencil,
  Message: MessageSquare,
  Clip: Paperclip,
  Subtasks: ListTodo,
  Priority: AlertCircle,
  Points: TrendingUp,
  Shield,
  Info,
  Pencil,
  Trash2,
  TrendingUp: TrendingUp,
  RefreshCw,
  Sparkles: (props: any) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  )
};
