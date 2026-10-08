import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Job } from '../../types/ats';

interface ResumeUploaderModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'queued' | 'uploading' | 'analyzing' | 'completed' | 'failed' | 'duplicate';
  error?: string;
  score?: number;
  candidateName?: string;
}

export const ResumeUploaderModal: React.FC<ResumeUploaderModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'paste'>('files');
  const [fileList, setFileList] = useState<UploadFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedName, setPastedName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    const newItems: UploadFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt', 'doc'].includes(ext || '')) {
        continue;
      }
      newItems.push({
        id: `f-${Date.now()}-${i}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        status: 'queued'
      });
    }

    setFileList(prev => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setFileList(prev => prev.filter(f => f.id !== id));
  };

  const handleUploadAndAnalyze = async () => {
    if (fileList.length === 0) return;
    setIsProcessing(true);

    const formData = new FormData();
    fileList.forEach(item => {
      formData.append('resumes', item.file);
    });

    // Update statuses to analyzing
    setFileList(prev => prev.map(f => ({ ...f, status: 'analyzing' })));

    try {
      const res = await fetch(`/api/jobs/${job.id}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Map back results
      setFileList(prev =>
        prev.map((item, idx) => {
          const resItem = data.results?.[idx];
          if (resItem) {
            return {
              ...item,
              status: resItem.status === 'Success' ? 'completed' : resItem.isDuplicate ? 'duplicate' : 'failed',
              error: resItem.error,
              score: resItem.atsScore,
              candidateName: resItem.candidateName
            };
          }
          return { ...item, status: 'completed' };
        })
      );

      onSuccess();
    } catch (err: any) {
      setFileList(prev => prev.map(f => ({ ...f, status: 'failed', error: err.message })));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePastedSubmit = async () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/jobs/${job.id}/paste-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: pastedText,
          fileName: pastedName ? `${pastedName.replace(/\s+/g, '_')}_Resume.txt` : 'Pasted_Candidate_Resume.txt'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze pasted resume');

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error analyzing resume');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Upload & Screen Resumes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating candidates against: <span className="font-semibold text-slate-700">{job.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 border-b border-slate-100 flex gap-4">
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            File Upload (PDF / DOCX / TXT)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Direct Text Input (Quick Test)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'files' ? (
            <div className="space-y-5">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesAdded(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-8 text-center cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFilesAdded(e.target.files)}
                  multiple
                  accept=".pdf,.docx,.txt,.doc"
                  className="hidden"
                />
                <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Drag & Drop Resumes Here, or <span className="text-indigo-600 underline">Browse</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports multiple PDF, DOCX, and TXT files (up to 25MB each)
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">PDF</span>
                  <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">DOCX</span>
                  <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">TXT</span>
                </div>
              </div>

              {/* Uploaded Files Queue */}
              {fileList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                    <span>Uploaded Files ({fileList.length})</span>
                    <button
                      onClick={() => setFileList([])}
                      className="text-rose-600 hover:underline text-[11px]"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {fileList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatFileSize(item.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {item.status === 'analyzing' && (
                            <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Analyzing...
                            </span>
                          )}
                          {item.status === 'completed' && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {item.score !== undefined ? `${item.score}%` : 'Done'}
                            </span>
                          )}
                          {item.status === 'duplicate' && (
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Duplicate
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Failed
                            </span>
                          )}
                          {!isProcessing && item.status === 'queued' && (
                            <button
                              onClick={() => removeFile(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Name (Optional)
                </label>
                <input
                  type="text"
                  value={pastedName}
                  onChange={(e) => setPastedName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste Resume Content (Raw Text)
                </label>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste candidate work history, education, and technical skills..."
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The ATS parser will automatically extract contact info, skills, work timeline, and calculate the explainable score.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            AI + ATS Multi-factor Screening
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {activeTab === 'files' ? (
              <button
                onClick={handleUploadAndAnalyze}
                disabled={fileList.length === 0 || isProcessing}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Screening Resumes...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Start ATS Screening ({fileList.length})
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handlePastedSubmit}
                disabled={!pastedText.trim() || isProcessing}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Screening...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Analyze Resume
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
