import React, { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { Icons, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Priority } from '../types';

export const PersonalChecklistView = () => {
  const { 
    tasks, 
    user, 
    personalTodos, 
    addPersonalTodo, 
    togglePersonalTodo, 
    deletePersonalTodo,
    toggleSubtask,
    updateTaskStatus,
    openTaskDetails
  } = useTasks();

  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<Priority>('Medium');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Derive all tasks that are relevant: directly assigned, have due dates, or have assigned subtasks
  const workUnits = tasks
    .filter(task => 
      task.assignees.some(a => a.id === user.id) || 
      task.dueDate || 
      task.subtasks.some(st => st.assignees.some(a => a.id === user.id))
    )
    .map(task => ({
      ...task,
      completed: task.status === 'Done'
    }));

  const handleAddPersonalTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    
    addPersonalTodo({
      title: newTodoTitle,
      priority: newTodoPriority,
      dueDate: newTodoDueDate || undefined
    });
    setNewTodoTitle('');
    setNewTodoDueDate('');
  };

  const filteredPersonal = personalTodos.filter(todo => {
    if (filter === 'pending') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const filteredWorkUnits = workUnits.filter(unit => {
    if (filter === 'pending') {
      // Show if the main task is pending OR any subtask (that would be shown) is pending
      return !unit.completed || unit.subtasks.some(st => !st.completed);
    }
    if (filter === 'completed') {
      // Show if everything is done
      return unit.completed && unit.subtasks.every(st => st.completed);
    }
    return true;
  });

  const totalPendingUnits = workUnits.filter(unit => !unit.completed || unit.subtasks.some(st => !st.completed)).length;
  const totalPendingPersonal = personalTodos.filter(t => !t.completed).length;
  const totalPending = totalPendingUnits + totalPendingPersonal;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary-container">
            <div className="p-2 bg-primary-container/10 rounded-xl">
              <Icons.Check className="w-5 h-5" />
            </div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em]">Personal Space</h1>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            My <span className="text-primary-container">Checklist</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            You have <span className="text-primary-container font-black">{totalPending}</span> pending items across project subtasks and personal goals.
          </p>
        </div>

        <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === f 
                  ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm border border-slate-100 dark:border-slate-700" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Quick Add and Personal Items */}
        <section className="lg:col-span-7 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Icons.Plus className="w-4 h-4 text-primary-container" />
              Quick Tasks
            </h3>
          </div>

          <form onSubmit={handleAddPersonalTodo} className="relative group">
            <input 
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="What needs to get done?"
              className="w-full bg-white dark:bg-slate-900 px-8 py-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm focus:ring-4 focus:ring-primary-container/10 focus:border-primary-container outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 font-bold"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <input 
                type="date"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter outline-none border border-slate-100 dark:border-slate-700 cursor-pointer text-slate-500"
              />
              <select 
                value={newTodoPriority}
                onChange={(e) => setNewTodoPriority(e.target.value as Priority)}
                className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter outline-none border border-slate-100 dark:border-slate-700 cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">Highlight</option>
                <option value="Urgent">🔥 Urgent</option>
              </select>
              <button 
                type="submit"
                className="bg-primary-container text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary-container/20"
              >
                <Icons.Plus className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout text-center">
              {filteredPersonal.map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all",
                    todo.completed && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <button 
                      onClick={() => togglePersonalTodo(todo.id)}
                      className={cn(
                        "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all",
                        todo.completed 
                          ? "bg-primary-container border-primary-container text-white" 
                          : "border-slate-200 dark:border-slate-700 hover:border-primary-container"
                      )}
                    >
                      {todo.completed && <Icons.Check className="w-5 h-5" />}
                    </button>
                    <div>
                      <h4 className={cn(
                        "text-sm font-bold text-slate-800 dark:text-slate-100 transition-all",
                        todo.completed && "line-through text-slate-400"
                      )}>
                        {todo.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{todo.createdAt}</span>
                        {todo.dueDate && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-primary-container bg-primary-container/5 px-1.5 py-0.5 rounded">
                            <Icons.Calendar className="w-2.5 h-2.5" />
                            Due {todo.dueDate}
                          </span>
                        )}
                        <span className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                          todo.priority === 'Urgent' ? "bg-error/10 text-error" : 
                          todo.priority === 'High' ? "bg-amber-500/10 text-amber-500" :
                          "bg-slate-100 dark:bg-white/5 text-slate-400"
                        )}>
                          {todo.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deletePersonalTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-3 text-slate-300 hover:text-error hover:bg-error/5 rounded-xl transition-all"
                  >
                    <Icons.Delete className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredPersonal.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                <Icons.CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">Clean Slate</p>
              </div>
            )}
          </div>
        </section>

        {/* Assigned Work */}
        <section className="lg:col-span-5 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Icons.Users className="w-4 h-4 text-primary-container" />
              Assigned Items
            </h3>
          </div>

          <div className="space-y-4">
            {filteredWorkUnits.map((unit) => (
              <div key={unit.id} className="group/unit">
                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-primary-container/10 shadow-sm group hover:border-primary-container/20 transition-all overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={() => {
                          const newStatus = unit.completed ? 'To Do' : 'Done';
                          updateTaskStatus(unit.id, newStatus);
                        }}
                        className={cn(
                          "mt-1 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0",
                          unit.completed 
                            ? "bg-primary-container border-primary-container text-white" 
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        )}
                      >
                        {unit.completed && <Icons.Check className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-primary-container">Card</span>
                          {unit.dueDate && (
                            <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded tracking-tighter">
                              Due {unit.dueDate}
                            </span>
                          )}
                        </div>
                        <h4 className={cn(
                          "text-sm font-bold text-slate-800 dark:text-slate-100 truncate",
                          unit.completed && "line-through text-slate-400"
                        )}>
                          {unit.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Icons.Folder className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-tighter truncate max-w-[120px]">{unit.project}</span>
                          </div>
                          <button 
                            onClick={() => openTaskDetails(unit.id)}
                            className="text-[9px] font-black uppercase text-primary-container hover:underline tracking-widest ml-auto"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>

                    {unit.subtasks.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-2.5">
                        {unit.subtasks.map((st) => {
                          const isMine = st.assignees.some(a => a.id === user.id);
                          
                          if (filter === 'pending' && st.completed) return null;
                          if (filter === 'completed' && !st.completed) return null;

                          return (
                            <div 
                              key={st.id}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-2xl border transition-all group/st",
                                isMine 
                                  ? "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800" 
                                  : "border-transparent opacity-60"
                              )}
                            >
                              <button 
                                onClick={() => toggleSubtask(unit.id, st.id)}
                                className={cn(
                                  "mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0",
                                  st.completed 
                                    ? "bg-primary-container border-primary-container text-white" 
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                )}
                              >
                                {st.completed && <Icons.Check className="w-3.5 h-3.5" />}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <h5 className={cn(
                                  "text-xs font-bold text-slate-700 dark:text-slate-200 transition-all truncate",
                                  st.completed && "line-through text-slate-400 font-medium",
                                  isMine && "text-slate-900 dark:text-white"
                                )}>
                                  {st.title}
                                </h5>
                                <div className="flex items-center gap-2 mt-1">
                                  {isMine && (
                                    <span className="text-[7px] font-black uppercase tracking-widest text-primary-container bg-primary-container/10 px-1 rounded-sm">Assigned to me</span>
                                  )}
                                  {st.dueDate && (
                                    <div className="flex items-center gap-1 opacity-60">
                                      <Icons.Calendar className="w-2.5 h-2.5" />
                                      <span className="text-[8px] font-black uppercase tracking-tighter">Due {st.dueDate}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredWorkUnits.length === 0 && (
              <div className="py-20 text-center bg-slate-50 dark:bg-slate-950/50 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 transition-all">
                <Icons.CheckCircle2 className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">All duties recorded</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-primary-container/5 rounded-[2.5rem] border border-primary-container/10">
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-container mb-4">Pro Tip</h5>
            <p className="text-[10px] text-primary-container/70 leading-relaxed font-medium">
              Subtasks completed here automatically update the progress bar on their respective project cards.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
