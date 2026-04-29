import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons, cn } from '../lib/utils';
import { useTasks } from '../contexts/TaskContext';
import { parseDocumentContent, ParsedData } from '../services/geminiService';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// pdfjs worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface MagicImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type InputMode = 'url' | 'file' | 'drive' | 'text';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink: string;
}

export const MagicImportModal = ({ isOpen, onClose }: MagicImportModalProps) => {
  const { addTask, addProject, addEngagement, user } = useTasks();
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input');
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [error, setError] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isDriveAuthed, setIsDriveAuthed] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkDriveStatus();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.provider === 'google') {
        setIsDriveAuthed(true);
        fetchDriveFiles();
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkDriveStatus = async () => {
    try {
      const res = await fetch('/api/auth/google/status');
      const data = await res.json();
      setIsDriveAuthed(data.isAuthenticated);
      if (data.isAuthenticated) {
        fetchDriveFiles();
      }
    } catch (e) {
      console.error("Status check error", e);
    }
  };

  const handleConnectDrive = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (e) {
      console.error("OAuth error", e);
      setError("Failed to initialize Google connection.");
    }
  };

  const fetchDriveFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch('/api/drive/files');
      const data = await response.json();
      if (data.files) {
        setDriveFiles(data.files);
      }
    } catch (e) {
      console.error("Fetch files error", e);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleDriveFileSelect = async (file: DriveFile) => {
    setIsExtracting(true);
    setError(null);
    try {
      const response = await fetch(`/api/drive/export?fileId=${file.id}&mimeType=${file.mimeType}`);
      const data = await response.json();
      if (data.text) {
        setContent(data.text);
        setInputMode('text');
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e) {
      console.error("Drive export error", e);
      setError("Failed to extract content from Google Drive file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const fetchUrlContent = async (targetUrl: string) => {
    try {
      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(targetUrl)}`);
      const data = await response.json();
      return data.text || null;
    } catch (e) {
      console.error("URL fetch error", e);
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setContent(result.value);
        setInputMode('text');
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        setContent(fullText);
        setInputMode('text');
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        setContent(text);
        setInputMode('text');
      } else {
        alert("Unsupported file type. Please use .docx, .pdf, or .txt");
      }
    } catch (e) {
      console.error("File upload error", e);
      alert("Error reading file content.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleParse = async () => {
    let textToParse = content;
    setError(null);

    if (inputMode === 'url') {
      if (!url.trim()) return;
      setIsExtracting(true);
      const extractedText = await fetchUrlContent(url);
      setIsExtracting(false);
      
      if (!extractedText) {
        setError("Failed to extract content from the URL. The page might be protected or unreachable.");
        return;
      }
      textToParse = extractedText;
    }

    if (!textToParse.trim()) {
      setError("Please provide some content or a link to analyze.");
      return;
    }
    
    setIsParsing(true);
    try {
      const data = await parseDocumentContent(textToParse);
      if (data && (data.projects.length > 0 || data.tasks.length > 0 || data.engagements.length > 0)) {
        setParsedData(data);
        setActiveTab('preview');
      } else {
        setError("AI couldn't find any projects, tasks, or engagements in the provided content. Try providing more detail.");
      }
    } catch (e) {
      console.error("Parse error", e);
      setError("An error occurred while analyzing the content. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    if (!parsedData) return;

    parsedData.projects.forEach(p => {
      addProject({
        name: p.name,
        description: p.description || '',
        category: p.category || 'General',
        phase: 'Discovery',
        status: 'Active',
        progress: 0,
        team: [user],
        dueDate: p.dueDate || new Date().toISOString(),
        icon: 'Folder',
        tags: [],
        attachments: []
      });
    });

    parsedData.tasks.forEach(t => {
      addTask({
        title: t.title,
        description: t.description || '',
        project: 'AI Imported',
        priority: t.priority || 'Medium',
        status: 'To Do',
        assignees: [user],
        reporter: user,
        dueDate: t.dueDate || new Date().toISOString(),
        tags: ['AI Imported'],
        subtasks: [],
        attachments: [],
        points: 1
      });
    });

    parsedData.engagements.forEach(e => {
      addEngagement({
        title: e.title,
        clientContact: user, // Placeholder
        accountLead: user,
        engagementDate: e.engagementDate || new Date().toLocaleString(),
        status: e.status || 'Active',
        priority: e.priority || 'Medium',
        cadence: e.cadence || 'One-time',
        recurrencePattern: e.recurrencePattern,
        stakeholders: [user],
        description: e.description || '',
        tasks: [],
        attachments: []
      });
    });

    onClose();
    reset();
  };

  const reset = () => {
    setContent('');
    setParsedData(null);
    setActiveTab('input');
    setIsParsing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[110]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[120] overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-container/10 rounded-2xl">
                    <Icons.Sparkles className="w-6 h-6 text-primary-container" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">AI Magic Import</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Parse Docs, Notes or Plans</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <Icons.Plus className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
              </div>

              {activeTab === 'input' ? (
                <div className="space-y-6">
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                    {(['url', 'file', 'drive', 'text'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setInputMode(mode)}
                        className={cn(
                          "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          inputMode === mode 
                            ? "bg-white dark:bg-slate-700 shadow-sm text-primary-container"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        {mode === 'drive' ? 'Google Drive' : mode}
                      </button>
                    ))}
                  </div>

                  {inputMode === 'url' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Paste Link</label>
                            <div className="relative">
                                <Icons.ExternalLink className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com/project-plan"
                                    className="w-full bg-slate-50 dark:bg-slate-950 pl-14 pr-6 py-5 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 transition-all font-medium text-sm"
                                />
                            </div>
                        </div>
                    </div>
                  )}

                  {inputMode === 'file' && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-64 bg-slate-50 dark:bg-slate-950 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary-container/50 hover:bg-primary-container/5 transition-all group"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload}
                            accept=".pdf,.docx,.txt"
                            className="hidden"
                        />
                        <div className="p-4 bg-primary-container/10 rounded-2xl group-hover:scale-110 transition-transform">
                            <Icons.Plus className="w-8 h-8 text-primary-container" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Upload Document</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">PDF, DOCX, or TXT</p>
                        </div>
                    </div>
                  )}

                  {inputMode === 'drive' && (
                    <div className="space-y-4">
                        {!isDriveAuthed ? (
                            <div className="w-full h-64 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-6">
                                <div className="p-4 bg-primary-container/10 rounded-2xl">
                                    <Icons.ExternalLink className="w-8 h-8 text-primary-container" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Connect Google Drive</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Select docs directly from your drive</p>
                                </div>
                                <button
                                    onClick={handleConnectDrive}
                                    className="px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
                                >
                                    Connect Account
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Documents</label>
                                    <button onClick={fetchDriveFiles} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                                        <Icons.RefreshCw className={cn("w-3 h-3 text-slate-400", isLoadingFiles && "animate-spin")} />
                                    </button>
                                </div>
                                <div className="h-64 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                    {isLoadingFiles ? (
                                        <div className="h-full flex items-center justify-center">
                                            <Icons.RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
                                        </div>
                                    ) : driveFiles.length > 0 ? (
                                        driveFiles.map((file) => (
                                            <button
                                                key={file.id}
                                                onClick={() => handleDriveFileSelect(file)}
                                                className="w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 hover:border-primary-container/50 hover:bg-primary-container/5 transition-all group text-left"
                                            >
                                                <img src={file.iconLink} alt="" className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{file.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{file.mimeType.split('.').pop()}</p>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                            <Icons.Boards className="w-8 h-8 text-slate-100 mb-4" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching files found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                  )}

                  {inputMode === 'text' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Content to Parse</label>
                        <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste your meeting notes, project plan, or doc content here..."
                        className="w-full h-64 bg-slate-50 dark:bg-slate-950 px-6 py-6 rounded-3xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-container/20 transition-all font-medium text-sm resize-none"
                        />
                    </div>
                  )}

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-6 py-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-center gap-3"
                    >
                      <Icons.Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest leading-relaxed">{error}</p>
                    </motion.div>
                  )}

                  <button
                    onClick={handleParse}
                    disabled={isParsing || isExtracting || (inputMode === 'url' ? !url.trim() : !content.trim())}
                    className={cn(
                      "w-full py-5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest",
                      isParsing || isExtracting || (inputMode === 'url' ? !url.trim() : !content.trim())
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        : "bg-primary-container text-white shadow-lg hover:shadow-primary-container/20 hover:-translate-y-0.5"
                    )}
                  >
                    {isParsing || isExtracting ? (
                      <>
                        <Icons.RefreshCw className="w-4 h-4 animate-spin" />
                        {isExtracting ? "Extracting..." : "Analyzing with AI..."}
                      </>
                    ) : (
                      <>
                        <Icons.Sparkles className="w-4 h-4" />
                        Generate Plan
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="max-h-[400px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                    {(parsedData?.projects?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-container ml-2">Projects to Create</h3>
                        {parsedData?.projects.map((p, i) => (
                          <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{p.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {(parsedData?.tasks?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-container ml-2">Tasks to Extract</h3>
                        {parsedData?.tasks.map((t, i) => (
                          <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                            <Icons.CheckCircle2 className="w-4 h-4 text-slate-300" />
                            <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t.priority} Priority</span>
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(parsedData?.engagements?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-container ml-2">Engagements Found</h3>
                        {parsedData?.engagements.map((e, i) => (
                          <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                             <div className="flex items-center gap-3">
                                <Icons.Boards className="w-4 h-4 text-primary-container" />
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{e.title}</p>
                             </div>
                             <p className="text-[10px] text-slate-500 mt-1 ml-7">{e.engagementDate} • {e.cadence}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab('input')}
                      className="flex-1 py-4 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleImport}
                      className="flex-1 py-4 bg-primary-container text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-primary-container/20 transition-all"
                    >
                      Import All Items
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
