import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import timeGridPlugin from '@fullcalendar/timegrid/index.js';
import interactionPlugin, { DateClickArg, EventDragStopArg } from '@fullcalendar/interaction/index.js';
import listPlugin from '@fullcalendar/list/index.js';
import multiMonthPlugin from '@fullcalendar/multimonth/index.js';
import { useTasks } from '../contexts/TaskContext';
import { Icons, cn } from '../lib/utils';
import { parse, isValid, startOfQuarter, endOfQuarter, eachMonthOfInterval, format, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Task, Project } from '../types';

const WeeklyColumnView = ({
  tasks,
  projects,
  onTaskClick
}: {
  tasks: Task[],
  projects: Project[],
  onTaskClick: (id: string) => void
}) => {
  const currentWeekStart = startOfWeek(new Date());
  const currentWeekEnd = endOfWeek(currentWeekStart);
  const days = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  return (
    <div className="flex gap-4 h-full p-2 animate-in slide-in-from-bottom-4 duration-500 overflow-x-auto custom-scrollbar pb-4">
      {days.map(day => {
        const dayTasks = tasks.filter(task => {
          const dueDate = parse(task.dueDate, 'MMM d, yyyy', new Date());
          return isValid(dueDate) && isSameDay(dueDate, day);
        }).sort((a, b) => {
          const dateA = parse(a.dueDate, 'MMM d, yyyy', new Date());
          const dateB = parse(b.dueDate, 'MMM d, yyyy', new Date());
          return (dateA.getTime() || 0) - (dateB.getTime() || 0);
        });

        const isToday = isSameDay(day, new Date());

        return (
          <div key={day.toISOString()} className={cn(
            "flex flex-col h-full min-w-[280px] rounded-[2rem] border overflow-hidden transition-all",
            isToday
              ? "bg-primary-container/5 border-primary-container/20 ring-1 ring-primary-container/10"
              : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/50"
          )}>
            <div className={cn(
              "p-5 border-b flex items-center justify-between backdrop-blur-sm",
              isToday
                ? "bg-primary-container/10 border-primary-container/10"
                : "bg-white/50 dark:bg-white/5 border-slate-100 dark:border-slate-800/50"
            )}>
              <div>
                <h3 className={cn(
                  "text-[9px] font-black uppercase tracking-[0.2em]",
                  isToday ? "text-primary-container" : "text-slate-400 dark:text-slate-500"
                )}>
                  {format(day, 'EEEE')}
                </h3>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{format(day, 'MMM d')}</h4>
              </div>
              <span className={cn(
                "text-[10px] font-black px-2.5 py-1 rounded-xl border",
                isToday
                  ? "bg-primary-container text-white border-primary-container"
                  : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
              )}>
                {dayTasks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {dayTasks.map(task => {
                const project = projects.find(p => p.name === task.project);

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    className="bg-white dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-1 h-8 rounded-full shrink-0 group-hover:scale-y-110 transition-transform" style={{ backgroundColor: project?.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">
                            {project?.name}
                          </span>
                        </div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight line-clamp-2 mb-2">
                          {task.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter",
                            task.status === 'Completed' ? "bg-success/10 text-success" :
                              task.status === 'In Progress' ? "bg-primary-container/10 text-primary-container" :
                                "bg-slate-100 dark:bg-white/5 text-slate-500"
                          )}>
                            {task.status}
                          </span>
                          <span className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter",
                            task.priority === 'Urgent' ? "bg-error text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"
                          )}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {dayTasks.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10 grayscale">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Free Day</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const QuarterlyColumnView = ({
  tasks,
  projects,
  onTaskClick
}: {
  tasks: Task[],
  projects: Project[],
  onTaskClick: (id: string) => void
}) => {
  const currentQuarterStart = startOfQuarter(new Date());
  const currentQuarterEnd = endOfQuarter(currentQuarterStart);
  const months = eachMonthOfInterval({ start: currentQuarterStart, end: currentQuarterEnd });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full p-2 animate-in slide-in-from-bottom-4 duration-500">
      {months.map(month => {
        const monthTasks = tasks.filter(task => {
          const dueDate = parse(task.dueDate, 'MMM d, yyyy', new Date());
          return isValid(dueDate) && isSameMonth(dueDate, month);
        }).sort((a, b) => {
          const dateA = parse(a.dueDate, 'MMM d, yyyy', new Date());
          const dateB = parse(b.dueDate, 'MMM d, yyyy', new Date());
          return (dateA.getTime() || 0) - (dateB.getTime() || 0);
        });

        return (
          <div key={month.toISOString()} className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Month</h3>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{format(month, 'MMMM yyyy')}</h4>
              </div>
              <span className="text-[11px] font-black px-3 py-1 rounded-xl bg-primary-container/10 text-primary-container border border-primary-container/20">
                {monthTasks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {monthTasks.map(task => {
                const project = projects.find(p => p.name === task.project);
                const dueDate = parse(task.dueDate, 'MMM d, yyyy', new Date());

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-1 h-8 rounded-full shrink-0 group-hover:scale-y-110 transition-transform" style={{ backgroundColor: project?.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                            {project?.name}
                          </span>
                        </div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight line-clamp-2 mb-3">
                          {task.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icons.Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500">
                              {format(dueDate, 'MMM d')}
                            </span>
                          </div>
                          <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                            task.priority === 'Urgent' ? "bg-error text-white shadow-sm shadow-error/30" : "bg-slate-100 dark:bg-white/5 text-slate-500"
                          )}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {monthTasks.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20 grayscale">
                  <div className="w-12 h-12 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <Icons.Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No deadlines</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const CalendarView = () => {
  const {
    filteredTasks,
    tasks,
    updateTask,
    openTaskDetails,
    projects,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    projectFilter,
    setProjectFilter
  } = useTasks();

  const [viewMode, setViewMode] = React.useState<string>('dayGridMonth');
  const calendarRef = React.useRef<FullCalendar>(null);

  React.useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      // Use requestAnimationFrame to avoid flushSync warning in React 18
      requestAnimationFrame(() => {
        calendarApi.changeView(viewMode);
      });
    }
  }, [viewMode]);

  const events = React.useMemo(() => {
    return filteredTasks.map(task => {
      const project = projects.find(p => p.name === task.project);
      const parsedDate = parse(task.dueDate, 'MMM d, yyyy', new Date());

      return {
        id: task.id,
        title: task.title,
        start: isValid(parsedDate) ? parsedDate : new Date(),
        allDay: true,
        backgroundColor: project?.color || '#6366f1',
        borderColor: project?.color || '#6366f1',
        extendedProps: {
          task,
          project
        }
      };
    });
  }, [filteredTasks, projects]);

  const handleEventClick = (info: any) => {
    openTaskDetails(info.event.id);
  };

  const handleEventDrop = (info: any) => {
    const { event } = info;
    const newDate = event.start;
    if (newDate) {
      const formattedDate = newDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      updateTask(event.id, { dueDate: formattedDate });
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mr-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Calendar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Timeline View • Scheduled Tasks & Deadlines</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => {
                setStatusFilter([]);
                setPriorityFilter([]);
                setProjectFilter([]);
              }}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Reset All Filters"
            >
              Reset
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
            <button
              onClick={() => setViewMode('multiMonthQuarter')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'multiMonthQuarter' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm border border-slate-100 dark:border-slate-700" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Quarter
            </button>
            <button
              onClick={() => setViewMode('dayGridMonth')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'dayGridMonth' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm border border-slate-100 dark:border-slate-700" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('listWeek')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'listWeek' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm border border-slate-100 dark:border-slate-700" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('listMonth')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'listMonth' ? "bg-white dark:bg-slate-800 text-primary-container shadow-sm border border-slate-100 dark:border-slate-700" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 calendar-container mr-10 relative">
        {viewMode === 'multiMonthQuarter' ? (
          <QuarterlyColumnView
            tasks={filteredTasks}
            projects={projects}
            onTaskClick={openTaskDetails}
          />
        ) : viewMode === 'listWeek' ? (
          <WeeklyColumnView
            tasks={filteredTasks}
            projects={projects}
            onTaskClick={openTaskDetails}
          />
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin]}
            initialView={viewMode}
            displayEventTime={false}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            events={events}
            eventClick={handleEventClick}
            editable={true}
            eventDrop={handleEventDrop}
            height="auto"
            dayMaxEvents={true}
            eventContent={(eventInfo) => {
              const task = eventInfo.event.extendedProps.task;

              if (viewMode === 'multiMonthQuarter') {
                return (
                  <div className="flex items-center gap-1 p-0.5 w-full overflow-hidden">
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: eventInfo.event.backgroundColor }} />
                    <span className="text-[9px] font-black truncate text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
                      {eventInfo.event.title}
                    </span>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-1 p-1 w-full group/event overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: eventInfo.event.backgroundColor }} />
                    <span className="text-xs font-black truncate text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                      {eventInfo.event.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-black px-1 rounded uppercase tracking-tighter",
                      task.priority === 'Urgent' ? "bg-error text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"
                    )}>
                      {task.priority}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 capitalize">
                      {task.status}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      <style>{`
        .calendar-container .fc {
          --fc-border-color: #f1f5f9;
          --fc-daygrid-event-dot-width: 8px;
          --fc-page-bg-color: transparent;
          font-family: inherit;
        }
        
        .dark .calendar-container .fc {
          --fc-border-color: #1e293b;
          --fc-neutral-text-color: #94a3b8;
        }

        .fc .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: -0.025em !important;
          color: #0f172a !important;
        }

        .dark .fc .fc-toolbar-title {
          color: #f8fafc !important;
        }

        .fc .fc-button-primary {
          background-color: #f1f5f9 !important;
          border: none !important;
          color: #64748b !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          padding: 8px 16px !important;
          border-radius: 12px !important;
          transition: all 0.2s !important;
        }

        .dark .fc .fc-button-primary {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #94a3b8 !important;
        }

        .fc .fc-button-primary:hover {
          background-color: #e2e8f0 !important;
          color: #0f172a !important;
        }

        .dark .fc .fc-button-primary:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #f8fafc !important;
        }

        .fc .fc-button-active {
          background-color: #6366f1 !important;
          color: white !important;
        }

        .fc .fc-col-header-cell-cushion {
          font-size: 10px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          padding: 12px !important;
          color: #64748b !important;
        }

        .fc .fc-daygrid-day-number {
          font-size: 11px !important;
          font-weight: 700 !important;
          padding: 8px !important;
          color: #94a3b8 !important;
        }

        .fc .fc-event {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          border-radius: 8px !important;
          margin: 2px 4px !important;
          cursor: pointer !important;
          background: white !important;
          transition: all 0.2s ease !important;
        }

        .fc .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
        }
        
        .dark .fc .fc-event {
          background: #1e293b !important;
        }

        .fc-multimonth {
          background: transparent !important;
        }

        .fc-multimonth-month {
          border: 1px solid #f1f5f9 !important;
          border-radius: 1.5rem !important;
          background: white !important;
          padding: 1rem !important;
          margin-bottom: 1rem !important;
        }

        .dark .fc-multimonth-month {
          border-color: #1e293b !important;
          background: #0f172a !important;
        }

        .fc-multimonth-title {
          font-size: 11px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          color: #64748b !important;
          margin-bottom: 1rem !important;
        }

        .fc .fc-day-today {
          background: rgba(99, 102, 241, 0.03) !important;
        }
        
        .dark .fc .fc-day-today {
          background: rgba(99, 102, 241, 0.05) !important;
        }
      `}</style>
    </div>
  );
};
