import React, { useState, useRef } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useDocuments } from '../../context/DocumentContext';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileCheck, 
  RefreshCw,
  Sparkles,
  Eye,
  X,
  CheckSquare,
  Square
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { 
    documents, 
    loading, 
    uploadDocument, 
    deleteDocument, 
    deleteMultipleDocuments, 
    clearAllDocuments, 
    seedSampleNotice 
  } = useDocuments();
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadError('');
    setUploadSuccess('');
    setIsProcessingFile(true);

    try {
      await uploadDocument(file);
      setUploadSuccess(`"${file.name}" uploaded and extracted successfully! Chunks are now indexed for student queries.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(err.message || 'File processing failed.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleManualUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Single document delete
  const handleDelete = async (doc) => {
    if (window.confirm(`Are you sure you want to delete "${doc.name}"? This file and its indexed passages will be permanently removed.`)) {
      try {
        await deleteDocument(doc.id);
        setSelectedDocIds(prev => prev.filter(id => id !== doc.id));
        setUploadSuccess(`"${doc.name}" was deleted successfully.`);
      } catch (err) {
        setUploadError(`Failed to delete document: ${err.message}`);
      }
    }
  };

  // Toggle individual row checkbox
  const handleToggleSelect = (docId) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  // Select all or deselect all
  const handleSelectAll = () => {
    if (selectedDocIds.length === documents.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(documents.map(d => d.id));
    }
  };

  // Batch delete selected files
  const handleDeleteSelected = async () => {
    if (selectedDocIds.length === 0) return;
    const count = selectedDocIds.length;
    if (window.confirm(`Are you sure you want to delete all ${count} selected document(s)?`)) {
      try {
        await deleteMultipleDocuments(selectedDocIds);
        setSelectedDocIds([]);
        setUploadSuccess(`Successfully deleted ${count} selected document(s).`);
      } catch (err) {
        setUploadError(`Failed to delete selected files: ${err.message}`);
      }
    }
  };

  // Clear entire knowledge base (Delete all previous files)
  const handleClearAll = async () => {
    if (documents.length === 0) return;
    if (window.confirm(`⚠️ PERMANENT DELETE WARNING:\nAre you sure you want to delete ALL ${documents.length} campus document(s)?\n\nThis will permanently clear the institutional knowledge base.`)) {
      try {
        await clearAllDocuments();
        setSelectedDocIds([]);
        setUploadSuccess('All previous campus documents have been permanently removed.');
      } catch (err) {
        setUploadError(`Failed to clear knowledge base: ${err.message}`);
      }
    }
  };

  const handleLoadSampleNotice = () => {
    seedSampleNotice();
    setUploadSuccess('Sample "Onam_Celebration_Notice.pdf" loaded into knowledge base!');
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status, errorMessage) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Extracting Text...</span>
          </span>
        );
      case 'Uploading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Uploading</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200" title={errorMessage || 'Extraction failed'}>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar role="admin" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {user?.full_name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Admin Portal • Institutional Document Management & Knowledge Retrieval Base
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Delete All Files button */}
            {documents.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition-colors shadow-sm"
                title="Permanently remove all previous documents from the knowledge base"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete All Files</span>
              </button>
            )}

            <button
              onClick={handleLoadSampleNotice}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors shadow-sm"
              title="Loads the example Onam Celebration Notice required for demonstration"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Load Demo Notice (Onam)</span>
            </button>

            <button
              onClick={handleManualUploadClick}
              disabled={isProcessingFile}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-md shadow-amber-600/20 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {uploadError && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold">Document Error: </strong>
              <span>{uploadError}</span>
            </div>
            <button onClick={() => setUploadError('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold">Success: </strong>
              <span>{uploadSuccess}</span>
            </div>
            <button onClick={() => setUploadSuccess('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Drag and Drop Upload Area */}
        <div className="mt-8">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />

          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={handleManualUploadClick}
            className={`
              relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-amber-400 bg-white hover:bg-slate-50/60'
              }
              ${isProcessingFile ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                Drag and drop your campus document here
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">
                or <span className="text-amber-600 font-semibold underline">browse from your computer</span>
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-500 bg-slate-100 py-1.5 px-3.5 rounded-full border border-slate-200">
                <span>Supported Formats:</span>
                <span className="font-semibold text-slate-700">PDF, TXT, DOCX</span>
                <span>•</span>
                <span>Max size: 10 MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Uploaded Campus Documents</h2>
              <p className="text-xs text-slate-500">
                Documents currently processed and queryable by students in the chatbot
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedDocIds.length > 0 && (
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs">
                  <span className="font-semibold text-amber-900">
                    {selectedDocIds.length} selected
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Selected</span>
                  </button>
                  <button
                    onClick={() => setSelectedDocIds([])}
                    className="text-slate-500 hover:text-slate-700 text-[11px] underline"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200/70 text-slate-700 rounded-lg">
                Total: {documents.length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {documents.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Knowledge base is currently empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  No campus documents are currently active. Upload official college circulars or load the demo notice to begin.
                </p>
                <button
                  onClick={handleLoadSampleNotice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Insert Sample Onam Notice</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedDocIds.length === documents.length && documents.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          title="Select all documents"
                        />
                      </th>
                      <th className="py-3.5 px-4 sm:px-6">Document Name</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Size</th>
                      <th className="py-3.5 px-4">Uploaded Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Delete Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <tr 
                          key={doc.id} 
                          className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}
                        >
                          <td className="py-4 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(doc.id)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate max-w-xs sm:max-w-sm">
                                  {doc.name}
                                </p>
                                {doc.chunks && doc.chunks.length > 0 && (
                                  <p className="text-[11px] text-slate-400">
                                    {doc.chunks.length} indexed retrieval chunks
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="uppercase text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {doc.file_type || doc.name.split('.').pop()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-500">
                            {formatFileSize(doc.file_size)}
                          </td>
                          <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(doc.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {renderStatusBadge(doc.status, doc.error_message)}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {doc.raw_content && (
                                <button
                                  onClick={() => setPreviewDoc(doc)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Preview extracted text"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(doc)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                                title="Delete document permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Extracted Text Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">{previewDoc.name}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-slate-700 bg-slate-50/50 whitespace-pre-wrap leading-relaxed">
              {previewDoc.raw_content}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-white rounded-b-2xl">
              <span className="text-xs text-slate-500">
                {previewDoc.chunks ? `${previewDoc.chunks.length} chunks indexed` : 'Indexed'}
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Campus AI Administrator Console • Authorized Personnel Only
      </footer>

    </div>
  );
}
