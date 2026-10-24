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
  Award,
  BookOpen,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { filterMockItems, getWardResolutions, saveWardResolution, sanitizeWardAttribution, WardResolutionDoc } from '../../lib/civicData';

export type AssemblyDocument = WardResolutionDoc;

interface WardDocumentsSectionProps {
  wardId: string;
  wardName: string;
  wardCounty?: string;
}

export default function WardDocumentsSection({ wardId, wardName, wardCounty = 'Kenya' }: WardDocumentsSectionProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AssemblyDocument[]>([]);
  const [clerkOfficerName, setClerkOfficerName] = useState('Office of the Ward Clerk');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<AssemblyDocument | null>(null);
  const [expandedDocIds, setExpandedDocIds] = useState<Set<string>>(new Set());

  const toggleExpandDoc = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  // Admins can post on any ward, but Clerks can post only on their own ward wall
  const isAssignedClerk = user?.role === 'CLERK' && (!user.wardId || user.wardId === wardId);
  const canManage = Boolean(user && (user.role === 'ADMIN' || isAssignedClerk));

  useEffect(() => {
    fetchDocuments();

    const handleSync = () => {
      fetchDocuments();
    };

    window.addEventListener('csrg_resolutions_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('csrg_resolutions_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [wardId, wardName]);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const resDocs = await getWardResolutions(wardId);

      // In case wardId in database is slug or id, also verify matching by wardName
      const matched = resDocs.filter(d => {
        if (!d) return false;
        if (d.wardId === wardId) return true;
        if (d.wardName && wardName && d.wardName.toLowerCase().trim() === wardName.toLowerCase().trim()) return true;
        if ((wardId === 'ward-7' || wardId === 'sikhendu' || wardName?.toLowerCase() === 'sikhendu') && 
            (d.wardId === 'ward-7' || d.wardId === 'sikhendu' || d.wardName?.toLowerCase() === 'sikhendu' || d.title?.toLowerCase().includes('sibembe'))) {
          return true;
        }
        return false;
      });

      setDocuments(matched);
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
UPLOADED BY: ${sanitizeWardAttribution(doc.uploadedBy)}

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
      const authorText = sanitizeWardAttribution(clerkOfficerName.trim() || 'Office of the Ward Clerk');

      const savedDoc = await saveWardResolution({
        wardId,
        wardName,
        county: wardCounty,
        title: uploadTitle.trim(),
        category: uploadCategory,
        documentDate: uploadDate,
        summary: uploadSummary.trim() || undefined,
        fileName: selectedFile?.name || `${uploadTitle.trim().replace(/\s+/g, '_')}.pdf`,
        fileSize: selectedFile?.size || '1.2 MB',
        fileType: selectedFile?.type || 'application/pdf',
        fileUrl: selectedFile?.dataUrl || undefined,
        isPinned: uploadIsPinned,
        uploadedBy: authorText
      });

      setDocuments(prev => [savedDoc, ...prev.filter(d => d.id !== savedDoc.id)]);

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
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. PINNED RESOLUTIONS AT THE VERY TOP OF EVERYTHING (ABOVE PAST ASSEMBLIES) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white rounded-3xl border-2 border-amber-300 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="bg-amber-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Pin className="w-3 h-3 fill-white rotate-45" /> Pinned Resolutions
              </span>
              <span className="text-xs font-bold text-amber-950 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                {wardName} Ward Civic Priority ({pinnedDocs.length})
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5">
              <Award className="w-7 h-7 text-amber-600" />
              Pinned Landmark Resolutions
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Official resolutions and binding citizen mandates ratified by consensus across citizen assemblies and mini-caucuses in {wardName} Ward. Pinned at the top for immediate access and community oversight.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setUploadIsPinned(true);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-sm hover:shadow-md cursor-pointer border border-amber-300"
            >
              <Upload className="w-4 h-4" />
              <span>+ Upload / Post Resolution</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white/80 rounded-2xl border border-stone-200 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-amber-600 mb-2"></div>
            <p className="text-xs text-stone-500">Loading pinned resolutions...</p>
          </div>
        ) : pinnedDocs.length === 0 ? (
          <div className="bg-white/80 rounded-2xl border border-dashed border-amber-300 p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Pin className="w-6 h-6 rotate-45" />
            </div>
            <h4 className="text-base font-bold text-stone-900">No Pinned Resolutions Yet in {wardName} Ward</h4>
            <p className="text-stone-500 text-xs max-w-md mx-auto">
              Official resolutions adopted in ward citizen assemblies or uploaded as landmark mandates will be pinned right here at the very top.
            </p>
            <button
              onClick={() => {
                setUploadIsPinned(true);
                setIsUploadModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload / Pin First Resolution</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedDocs.map(doc => {
              const isExpanded = expandedDocIds.has(doc.id);
              return (
                <div
                  key={doc.id}
                  className="bg-white border-2 border-amber-300 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group"
                >
                  <div className="absolute top-0 right-0">
                    <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5 fill-white" /> Pinned
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2.5 pr-16 flex-wrap">
                      <span className="text-[11px] font-bold text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-md">
                        {doc.category}
                      </span>
                      <span className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {formatDateDisplay(doc.documentDate)}
                      </span>
                      {doc.uploadedBy && (
                        <span className="text-[11px] text-stone-500 italic">
                          By {sanitizeWardAttribution(doc.uploadedBy)}
                        </span>
                      )}
                    </div>

                    <h4 
                      onClick={() => setPreviewDoc(doc)}
                      className="text-lg sm:text-xl font-bold text-sky-950 mb-3 leading-snug hover:text-amber-700 cursor-pointer transition-colors"
                      title="Click to view and read full resolution"
                    >
                      {doc.title}
                    </h4>

                    {doc.summary && (
                      <div className="mb-4 bg-amber-50/40 rounded-xl p-3.5 border border-amber-200/60">
                        <p className={`text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {doc.summary}
                        </p>
                        {doc.summary.length > 140 && (
                          <button
                            type="button"
                            onClick={(e) => toggleExpandDoc(doc.id, e)}
                            className="text-xs font-black text-amber-800 hover:text-amber-900 mt-2 inline-flex items-center gap-1 cursor-pointer bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <span>Collapse Text</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>Read Whole Resolution Inline</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-amber-200/60 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="text-[11px] text-stone-500 truncate max-w-[150px]">
                      {doc.fileName || 'Resolution Document'} • {doc.fileSize || 'PDF'}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-3.5 py-1.5 rounded-xl border border-amber-300 font-bold flex items-center gap-1.5 text-xs transition-colors cursor-pointer shadow-2xs"
                        title="Open full reader and inspect official document"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                        <span>Read Full Resolution</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDownload(doc, e)}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 text-xs transition-colors shadow-2xs cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      {canManage && (
                        <div className="flex items-center gap-1 border-l border-stone-200 pl-1.5 ml-1">
                          <button
                            type="button"
                            title="Unpin document"
                            onClick={(e) => handleTogglePin(doc, e)}
                            className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pin className="w-3.5 h-3.5 fill-amber-600" />
                          </button>
                          <button
                            type="button"
                            title="Delete document"
                            onClick={(e) => handleDelete(doc.id, e)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* ========================================================================= */}
      {/* 2. PAST ASSEMBLIES & RESOLUTIONS DOCUMENTS (BELOW PINNED RESOLUTIONS) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
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
              onClick={() => {
                setUploadIsPinned(false);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document / Resolutions</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
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

        {/* Loading / Empty / Archive List */}
        {loading ? (
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-3"></div>
            <p className="text-xs text-stone-500">Loading ward assembly archive...</p>
          </div>
        ) : regularDocs.length === 0 ? (
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-sky-950">No Archive Documents Found</h3>
            <p className="text-stone-500 text-xs max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'All' || selectedYear !== 'All' 
                ? 'No documents match your current filter criteria. Try resetting filters.'
                : `No additional archive documents found for ${wardName} Ward. Check the pinned resolutions above or upload minutes.`}
            </p>
            <button
              onClick={() => {
                setUploadIsPinned(false);
                setIsUploadModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-4 py-2 rounded-xl cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Assembly Document
            </button>
          </div>
        ) : (
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
                            By {sanitizeWardAttribution(doc.uploadedBy)}
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
        )}
      </div>

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
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 text-white p-6 relative shrink-0">
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
              <form onSubmit={handleUploadSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
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

                  <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3">
                    <label className="block text-xs font-bold text-sky-950 mb-0.5">
                      Certified Authority / Official Signatory
                    </label>
                    <p className="text-xs font-semibold text-sky-900">
                      Office of the Ward Clerk (Official Ward Secretariat)
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Published under the authority of the Office of the Ward Clerk. In accordance with civic confidentiality and neutrality standards, personal administrator and clerk names are hidden from public records.
                    </p>
                  </div>

                  {/* File Attachment */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Attach File (PDF, DOCX, TXT, or Scan)
                    </label>
                    <div className="border-2 border-dashed border-stone-200 hover:border-sky-400 rounded-2xl p-4 text-center bg-stone-50/60 transition-colors">
                      {selectedFile ? (
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-sky-200 shadow-2xs">
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
                            ✕ Remove
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
                </div>

                {/* Fixed Sticky Footer with Submit Button - Always Visible */}
                <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 shrink-0 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{uploading ? 'Archiving & Publishing...' : 'Submit & Publish Resolution'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. DOCUMENT PREVIEW & FULL RESOLUTION READER MODAL */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDoc(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden z-10 max-h-[92vh] flex flex-col border border-stone-200"
            >
              {/* Reader Header */}
              <div className="bg-gradient-to-r from-stone-950 via-sky-950 to-stone-900 text-white p-6 sm:p-7 relative shrink-0 border-b border-amber-500/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] bg-sky-500/30 text-sky-200 px-3 py-1 rounded-full uppercase font-black border border-sky-400/30">
                        {previewDoc.category}
                      </span>
                      {previewDoc.isPinned && (
                        <span className="text-[10px] bg-amber-400 text-stone-950 px-2.5 py-1 rounded-full uppercase font-black flex items-center gap-1 shadow-xs">
                          <Pin className="w-2.5 h-2.5 fill-stone-950" /> Pinned Landmark Resolution
                        </span>
                      )}
                      <span className="text-xs text-amber-300 font-bold">
                        {wardName} Ward • {previewDoc.county || wardCounty}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                      {previewDoc.title}
                    </h3>
                    <p className="text-xs text-stone-300 flex items-center gap-2 flex-wrap">
                      <span>Ratification Date: <strong>{formatDateDisplay(previewDoc.documentDate)}</strong></span>
                      <span>•</span>
                      <span>Certified by: <strong>{sanitizeWardAttribution(previewDoc.uploadedBy)}</strong></span>
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
                    title="Close Reader"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Reader Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm text-stone-700 bg-stone-50/40">
                {/* 1. In-Browser Document / PDF Preview (if fileUrl present) */}
                {previewDoc.fileUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                      <span className="flex items-center gap-1.5 text-sky-900">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span>Attached Document Viewer ({previewDoc.fileName || 'Official Record'})</span>
                      </span>
                      <a
                        href={previewDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 hover:text-sky-900 font-extrabold flex items-center gap-1 hover:underline"
                      >
                        <span>Open Full Screen in New Tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="rounded-2xl border-2 border-stone-300 overflow-hidden bg-stone-900 shadow-sm">
                      {previewDoc.fileUrl.startsWith('data:image') || previewDoc.fileType?.includes('image') ? (
                        <div className="p-3 bg-stone-100 text-center">
                          <img
                            src={previewDoc.fileUrl}
                            alt={previewDoc.title}
                            className="max-h-[500px] w-auto mx-auto rounded-xl object-contain shadow-xs"
                          />
                        </div>
                      ) : (
                        <iframe
                          src={previewDoc.fileUrl}
                          className="w-full h-[450px] bg-white border-0"
                          title={previewDoc.title}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Whole Resolution Mandate & Deliberations Text */}
                <div className="bg-white border-2 border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-3">
                    <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      <span>Whole Resolution Mandate & Deliberations Text</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const copyContent = `${previewDoc.title}\nDate: ${formatDateDisplay(previewDoc.documentDate)}\nWard: ${wardName} Ward\nCertified By: ${sanitizeWardAttribution(previewDoc.uploadedBy)}\n\n${previewDoc.summary || ''}`;
                        navigator.clipboard.writeText(copyContent);
                        alert('Full resolution text copied to clipboard!');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-900 font-bold bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Text</span>
                    </button>
                  </div>

                  <div className="text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                    {previewDoc.summary || 'Official deliberations signed and confirmed by community representatives.'}
                  </div>
                </div>

                {/* 3. Archival Metadata & Certification Seal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                    <h5 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider">
                      Archival & Certification Details
                    </h5>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-stone-400 block">File Record:</span>
                        <span className="font-semibold text-stone-800 truncate block">{previewDoc.fileName}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">File Size:</span>
                        <span className="font-semibold text-stone-800">{previewDoc.fileSize || 'Standard Document'}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">Ratified Date:</span>
                        <span className="font-semibold text-stone-800">{formatDateDisplay(previewDoc.documentDate)}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">Signatory / Clerk:</span>
                        <span className="font-semibold text-stone-800">{sanitizeWardAttribution(previewDoc.uploadedBy)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900 space-y-1">
                      <p className="font-black text-emerald-950">Certified Wananchi Public Record</p>
                      <p className="text-emerald-800 leading-relaxed">
                        This resolution was deliberated and ratified through community consensus in {wardName} Ward under the Civil Society Reference Group (CSRG) Kenya.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reader Footer Actions */}
              <div className="p-4 sm:p-6 border-t border-stone-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors"
                >
                  Close Reader
                </button>
                <div className="flex items-center gap-2">
                  {previewDoc.fileUrl && (
                    <a
                      href={previewDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-stone-300 transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open File in Tab</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownload(previewDoc)}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official Document</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
