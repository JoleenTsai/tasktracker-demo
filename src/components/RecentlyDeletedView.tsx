import React from 'react';
import { useTasks } from '../contexts/TaskContext';
import { Icons, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const RecentlyDeletedView = () => {
  const { deletedTasks, restoreTask, permanentlyDeleteTask } = useTasks();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-error/10 rounded-2xl">
              <Icons.Delete className="h-6 w-6 text-error" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Recently Deleted</h1>
              <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px] mt-1">Review and restore recently removed tasks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-slate-800/40 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deleted At</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Project</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              <AnimatePresence mode="popLayout">
                {deletedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-50">
                        <Icons.Delete className="h-8 w-8 text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trash is empty</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deletedTasks.map((task, i) => (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{task.title}</span>
                          <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest font-mono">{task.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{task.deletedAt}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Icons.Folder className="h-3 w-3 text-primary-container" />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{task.project}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => restoreTask(task.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            <Icons.CheckCircle2 className="h-3 w-3" />
                            Restore
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Permanently delete this task? This cannot be undone.')) {
                                permanentlyDeleteTask(task.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            title="Delete Permanently"
                          >
                            <Icons.Delete className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
