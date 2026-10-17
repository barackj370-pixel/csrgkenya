import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Pin, 
  Calendar, 
  Upload, 
  Search, 
  Filter, 
  CheckCircle2, 
  X, 
  Eye, 
  Trash2, 
  FileCheck,
  ShieldAlert,
  Tag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export interface AssemblyDocument {
  id: string;
  wardId: string;
  title: string;
  category: string;
  documentDate: string;
  summary?: string;
  fileUrl?: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  isPinned: boolean;
  uploadedBy?: string;
  createdAt?: string;
}

interface WardDocumentsSectionProps {
  wardId: string;
  wardName: string;
}

export default function WardDocumentsSection({ wardId, wardName }: WardDocumentsSectionProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AssemblyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<AssemblyDocument | null>(null);

  // Upload Form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Assembly Resolutions');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadSummary, setUploadSummary] = useState('');
  const [uploadIsPinned, setUploadIsPinned] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; type: string; dataUrl?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const categories = [
    'All',
    'Assembly Resolutions',
    'Official Minutes',
    'Community Petition',
    'Implementation Report',
    'Citizen Charter'
  ];

  const canManage = Boolean(user && (user.role === 'ADMIN' || user.role === 'CLERK' || user.wardId === wardId));

  useEffect(() => {
    fetchDocuments();
  }, [wardId]);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('AssemblyDocument')
        .select('*')
        .eq('wardId', wardId)
        .order('isPinned', { ascending: false })
        .order('documentDate', { ascending: false });

      if (!error && data && data.length > 0) {
        setDocuments(data);
      } else {
        // Fallback to local storage cache if table does not exist yet in Supabase
        try {
          const raw = localStorage.getItem('csrg_mock_db_v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            const localDocs = parsed.AssemblyDocument || [];
            const wardDocs = localDocs.filter((d: any) => d.wardId === wardId || d.wardId === 'ward-1');
            if (wardDocs.length > 0) {
              setDocuments(wardDocs);
            }
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('AssemblyDocument fetch completed with fallback:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: sizeFormatted,
        type: file.type || 'application/pdf',
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePin = async (doc: AssemblyDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedPinned = !doc.isPinned;
      await supabase
        .from('AssemblyDocument')
        .update({ isPinned: updatedPinned })
        .eq('id', doc.id);

      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, isPinned: updatedPinned } : d));
    } catch (err) {
      console.warn('Failed to toggle pin', err);
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this document from the ward archive?')) return;
    try {
      await supabase.from('AssemblyDocument').delete().eq('id', docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.warn('Failed to delete document', err);
    }
  };

  const handleDownload = (doc: AssemblyDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Generate a formatted printable/text document with official metadata
      const content = `CIVIL SOCIETY REFERENCE GROUP (CSRG) KENYA
NATIONAL & WARD CITIZEN ASSEMBLY RESOLUTION DOCUMENT

WARD: ${wardName}
DOCUMENT TITLE: ${doc.title}
CATEGORY: ${doc.category}
DATE OF ASSEMBLY: ${doc.documentDate}
UPLOADED BY: ${doc.uploadedBy || 'Ward Assembly Secretariat'}

SUMMARY OF RESOLUTIONS & DELIBERATIONS:
------------------------------------------------------------
${doc.summary || 'Official deliberations ratified by participating community groups.'}

STATUS: Certified Official Citizen Assembly Record
------------------------------------------------------------
Generated via CSRG Citizen Assembly Digital Portal`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.fileName || doc.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (!uploadTitle.trim()) {
      setUploadError('Please provide a document title.');
      return;
    }
    if (!uploadDate) {
      setUploadError('Please specify the date of the assembly or document.');
      return;
    }

    setUploading(true);

    try {
      const newDocItem: Omit<AssemblyDocument, 'id'> = {
        wardId,
        title: uploadTitle.trim(),
        category: uploadCategory,
        documentDate: uploadDate,
        summary: uploadSummary.trim() || undefined,
        fileName: selectedFile?.name || `${uploadTitle.trim().replace(/\s+/g, '_')}.pdf`,
        fileSize: selectedFile?.size || '1.2 MB',
        fileType: selectedFile?.type || 'application/pdf',
        fileUrl: selectedFile?.dataUrl || undefined,
        isPinned: uploadIsPinned,
        uploadedBy: user?.name ? `${user.name} (${user.role === 'CLERK' ? 'Ward Clerk' : user.role === 'ADMIN' ? 'Admin' : 'Representative'})` : 'Ward Secretariat',
        createdAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('AssemblyDocument')
        .insert([newDocItem])
        .select()
        .single();

      if (error) {
        console.warn('AssemblyDocument insert returned error, saving to local cache:', error);
        const fallbackDoc: AssemblyDocument = {
          ...newDocItem,
          id: `doc-local-${Date.now()}`
        };
        setDocuments(prev => [fallbackDoc, ...prev]);
        try {
          const raw = localStorage.getItem('csrg_mock_db_v1');
          const parsed = raw ? JSON.parse(raw) : {};
          parsed.AssemblyDocument = [fallbackDoc, ...(parsed.AssemblyDocument || [])];
          localStorage.setItem('csrg_mock_db_v1', JSON.stringify(parsed));
        } catch {
          // ignore
        }
      } else if (data) {
        setDocuments(prev => [data, ...prev]);
      }

      // Reset form
      setUploadTitle('');
      setUploadSummary('');
      setUploadIsPinned(false);
      setSelectedFile(null);
      setIsUploadModalOpen(false);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  // Distinct available years from documents
  const availableYears = Array.from(
    new Set(
      documents
        .map(d => d.documentDate ? new Date(d.documentDate).getFullYear().toString() : '')
        .filter(Boolean)
    )
  ).sort((a, b) => Number(b) - Number(a));

  // Filtered documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.fileName && doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesYear = selectedYear === 'All' || (doc.documentDate && new Date(doc.documentDate).getFullYear().toString() === selectedYear);

    return matchesSearch && matchesCategory && matchesYear;
  });

  const pinnedDocs = filteredDocuments.filter(d => d.isPinned);
  const regularDocs = filteredDocuments.filter(d => !d.isPinned);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-sky-100 text-sky-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Official Ward Archive
              </span>
              <span className="text-xs text-stone-400 font-medium">{wardName} Ward</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-sky-950 flex items-center gap-2">
              <FileText className="w-7 h-7 text-sky-600" />
              Past Assemblies & Resolutions Documents
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
              Access official minutes, signed resolutions, and citizen petitions from previous assemblies. Landmark resolutions are pinned for transparency.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document / Resolutions</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resolutions, minutes, or keywords..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="md:col-span-4 relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800 font-medium"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Document Categories' : c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800 font-medium"
            >
              <option value="All">All Dates</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-3"></div>
          <p className="text-xs text-stone-500">Loading ward assembly documents & resolutions...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-sky-950">No Documents Found</h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'All' || selectedYear !== 'All' 
              ? 'No documents match your current filter criteria. Try resetting filters.'
              : `No official assembly documents or resolutions have been uploaded for ${wardName} Ward yet.`}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-4 py-2 rounded-xl"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload First Assembly Document
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. PINNED RESOLUTIONS SECTION */}
          {pinnedDocs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                <Pin className="w-4 h-4 text-amber-600 rotate-45" />
                <span>Pinned Landmark Resolutions ({pinnedDocs.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border-2 border-amber-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0">
                      <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5 fill-white" /> Pinned
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2 pr-16">
                        <span className="text-[11px] font-bold text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-md">
                          {doc.category}
                        </span>
                        <span className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {formatDateDisplay(doc.documentDate)}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-sky-950 mb-2 leading-snug">
                        {doc.title}
                      </h4>

                      {doc.summary && (
                        <p className="text-xs text-stone-600 mb-4 line-clamp-3 leading-relaxed">
                          {doc.summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-stone-500 truncate max-w-[150px]">
                        {doc.fileName} • {doc.fileSize || 'PDF'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="bg-white hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 font-bold flex items-center gap-1 text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDownload(doc, e)}
                          className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>

                        {canManage && (
                          <button
                            type="button"
                            title="Unpin document"
                            onClick={(e) => handleTogglePin(doc, e)}
                            className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pin className="w-3.5 h-3.5 fill-amber-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. CHRONOLOGICAL ARCHIVE BY DATE */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-stone-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600" />
                Assembly Documents Archive ({regularDocs.length})
              </span>
              <span className="text-[11px] text-stone-400 font-normal">Organised by Date</span>
            </div>

            <div className="space-y-3">
              {regularDocs.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-sky-300 hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex flex-col items-center justify-center shrink-0 border border-sky-100">
                      <span className="text-[10px] font-bold uppercase leading-none">
                        {new Date(doc.documentDate).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-base font-black leading-none mt-1">
                        {new Date(doc.documentDate).getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                          {doc.category}
                        </span>
                        <span className="text-xs text-stone-400">
                          {formatDateDisplay(doc.documentDate)}
                        </span>
                        {doc.uploadedBy && (
                          <span className="text-[11px] text-stone-400 italic">
                            By {doc.uploadedBy}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-sky-950 group-hover:text-sky-700 transition-colors">
                        {doc.title}
                      </h4>

                      {doc.summary && (
                        <p className="text-xs text-stone-600 line-clamp-2 max-w-3xl">
                          {doc.summary}
                        </p>
                      )}

                      <div className="text-[11px] text-stone-400 flex items-center gap-2 pt-1">
                        <span>{doc.fileName}</span>
                        <span>•</span>
                        <span>{doc.fileSize || 'PDF Document'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="bg-stone-50 hover:bg-stone-100 text-stone-700 px-3 py-2 rounded-xl border border-stone-200 font-bold flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDownload(doc, e)}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    {canManage && (
                      <div className="flex items-center gap-1 border-l border-stone-200 pl-2 ml-1">
                        <button
                          type="button"
                          title="Pin this document"
                          onClick={(e) => handleTogglePin(doc, e)}
                          className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete document"
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. UPLOAD DOCUMENT MODAL */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 text-white p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] bg-sky-500/30 text-sky-200 px-2.5 py-0.5 rounded-full uppercase font-bold border border-sky-400/30">
                      Archive Upload
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      Upload Assembly Document & Resolutions
                    </h3>
                    <p className="text-xs text-stone-300 mt-0.5">
                      Add official records for {wardName} Ward
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="p-2 text-stone-400 hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                {uploadError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Ward Assembly Resolutions Matrix & Signed Charter - Q4 2026"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Document Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900 font-medium"
                    >
                      <option value="Assembly Resolutions">Assembly Resolutions</option>
                      <option value="Official Minutes">Official Minutes</option>
                      <option value="Community Petition">Community Petition</option>
                      <option value="Implementation Report">Implementation Report</option>
                      <option value="Citizen Charter">Citizen Charter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Assembly / Document Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Summary of Resolutions & Deliberations
                  </label>
                  <textarea
                    rows={3}
                    value={uploadSummary}
                    onChange={(e) => setUploadSummary(e.target.value)}
                    placeholder="Briefly outline key decisions, agreed action points, and committee assignments..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                  />
                </div>

                {/* File Attachment */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Attach File (PDF, DOCX, TXT, or Scan)
                  </label>
                  <div className="border-2 border-dashed border-stone-200 hover:border-sky-400 rounded-2xl p-4 text-center bg-stone-50/60 transition-colors">
                    {selectedFile ? (
                      <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-sky-200">
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="text-left truncate">
                            <p className="text-xs font-bold text-stone-900 truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-stone-400">{selectedFile.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-stone-400 hover:text-red-600 text-xs font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-2">
                        <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                        <span className="text-xs font-bold text-sky-700 block">Click to select document from device</span>
                        <span className="text-[10px] text-stone-400 block mt-0.5">Supports PDF, Word documents, text minutes, or scans</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Pin toggle */}
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="pinToggle"
                    checked={uploadIsPinned}
                    onChange={(e) => setUploadIsPinned(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="pinToggle" className="text-xs font-bold text-amber-950 cursor-pointer flex-1">
                    Pin this document to the top of {wardName} Ward archive
                    <span className="block text-[11px] font-normal text-amber-700 mt-0.5">
                      Pinned documents appear prominently with a gold badge for wananchi to consult quickly.
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? 'Archiving Document...' : 'Publish to Ward Archive'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. DOCUMENT PREVIEW MODAL */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDoc(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 text-white p-6 relative shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-sky-500/30 text-sky-200 px-2.5 py-0.5 rounded-full uppercase font-bold border border-sky-400/30">
                        {previewDoc.category}
                      </span>
                      {previewDoc.isPinned && (
                        <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase font-bold flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5 fill-white" /> Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      {previewDoc.title}
                    </h3>
                    <p className="text-xs text-stone-300 mt-1 flex items-center gap-2">
                      <span>{wardName} Ward</span>
                      <span>•</span>
                      <span>Assembly Date: {formatDateDisplay(previewDoc.documentDate)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 text-stone-400 hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm text-stone-700">
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider">
                    Official Document Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 block">File Name:</span>
                      <span className="font-semibold text-stone-800">{previewDoc.fileName}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">File Size:</span>
                      <span className="font-semibold text-stone-800">{previewDoc.fileSize || 'Standard PDF'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Date Certified:</span>
                      <span className="font-semibold text-stone-800">{formatDateDisplay(previewDoc.documentDate)}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Archived By:</span>
                      <span className="font-semibold text-stone-800">{previewDoc.uploadedBy || 'Ward Secretariat'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider mb-2">
                    Resolutions & Deliberations Summary
                  </h4>
                  <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 text-stone-800 leading-relaxed whitespace-pre-wrap">
                    {previewDoc.summary || 'Official deliberations signed and confirmed by community representatives.'}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900">
                    <p className="font-bold">Official Public Record</p>
                    <p className="mt-0.5 text-emerald-700">
                      This document forms part of the permanent citizen assembly archive under the Civil Society Reference Group (CSRG) Kenya.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
