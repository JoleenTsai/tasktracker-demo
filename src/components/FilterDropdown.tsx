import React, { useState, useRef, useEffect } from 'react';
import { Icons, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  icon?: keyof typeof Icons;
}

export const FilterDropdown = ({ label, options, selectedValues, onChange, icon }: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const Icon = icon ? Icons[icon] : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
          selectedValues.length > 0
            ? "bg-primary-container text-white border-primary-container shadow-md shadow-primary-container/20"
            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800"
        )}
      >
        {Icon && <Icon className="h-3 w-3" />}
        <span>{label}</span>
        {selectedValues.length > 0 && (
          <span className="bg-white text-primary-container rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black ml-1">
            {selectedValues.length}
          </span>
        )}
        <Icons.ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">{label}</span>
              {selectedValues.length > 0 && (
                <button 
                  onClick={clearFilter}
                  className="text-[8px] font-black uppercase tracking-widest text-error hover:underline px-2"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="p-1 max-h-64 overflow-y-auto custom-scrollbar">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all",
                      isSelected 
                        ? "bg-primary-container/10 text-primary-container" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && <div className="h-4 w-4">{option.icon}</div>}
                      <span className="text-xs font-bold uppercase tracking-tight">{option.label}</span>
                    </div>
                    {isSelected && <Icons.Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
