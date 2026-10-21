import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  MapPin, 
  Calendar, 
  Download, 
  Upload, 
  Search, 
  CheckCircle2, 
  Eye, 
  Plus, 
  Building2, 
  Pin, 
  X, 
  FileCheck,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';
import { getWardResolutions, saveWardResolution, WardResolutionDoc, filterMockItems } from '../../lib/civicData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { searchKenyaWards } from '../../data/kenyaCountiesAndWards';

export default function HomepageWardResolutions() {
  const { user } = useAuth();
  const [resolutions, setResolutions] = useState<WardResolutionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<WardResolutionDoc | null>(null);

  // Form state
  const [formWardName, setFormWardName] = useState('Kangemi');
  const [formCounty, setFormCounty] = useState('Nairobi');
  const [formWardId, setFormWardId] = useState('ward-1');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Assembly Resolutions');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSummary, setFormSummary] = useState('');
  const [formOfficerName, setFormOfficerName] = useState(user?.name ? `${user.name} (${user.role === 'CLERK' ? 'Ward Clerk' : user.role === 'ADMIN' ? 'Admin' : 'Representative'})` : '');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; type: string; dataUrl?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Available wards from DB
  const [availableWards, setAvailableWards] = useState<any[]>([]);

  const categories = [
    'All',
    'Assembly Resolutions',
    'Official Minutes',
    'Community Petition',
    'Implementation Report',
    'Citizen Charter'
  ];

  useEffect(() => {
    loadData();

    // Listen to storage and custom events so resolutions uploaded from Ward page immediately sync here
    const handleStorageChange = () => {
      loadData();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('csrg_resolutions_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('csrg_resolutions_updated', handleStorageChange);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [resList, wardsRes] = await Promise.all([
        getWardResolutions(),
        supabase.from('Ward').select('*')
      ]);
      setResolutions(resList);
      if (wardsRes.data && wardsRes.data.length > 0) {
        setAvailableWards(wardsRes.data);
      }
    } catch (err) {
      console.warn('Failed to load resolutions on homepage:', err);
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

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Please enter a resolution title.');
      return;
    }
    if (!formDate) {
      setFormError('Please enter the date of assembly ratification.');
      return;
    }

    setSubmitting(true);
    try {
      const author = formOfficerName.trim() || (user?.name ? `${user.name} (${user.role === 'CLERK' ? 'Ward Clerk' : user.role === 'ADMIN' ? 'Admin' : 'Representative'})` : 'Ward Clerk');

      const saved = await saveWardResolution({
        wardId: formWardId || 'ward-1',
        wardName: formWardName || 'Ward',
        county: formCounty || 'County',
        title: formTitle.trim(),
        category: formCategory,
        documentDate: formDate,
        summary: formSummary.trim() || undefined,
        fileName: selectedFile?.name || `${formTitle.trim().replace(/\s+/g, '_')}.pdf`,
        fileSize: selectedFile?.size || '1.2 MB',
        fileType: selectedFile?.type || 'application/pdf',
        fileUrl: selectedFile?.dataUrl || undefined,
        isPinned: formIsPinned,
        uploadedBy: author
      });

      setResolutions(prev => [saved, ...prev]);
      setIsPostModalOpen(false);

      // Reset
      setFormTitle('');
      setFormSummary('');
      setSelectedFile(null);
      setFormIsPinned(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to post resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (doc: WardResolutionDoc, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `CIVIL SOCIETY REFERENCE GROUP (CSRG) KENYA
NATIONAL & WARD CITIZEN ASSEMBLY RESOLUTION DOCUMENT

WARD: ${doc.wardName || 'Ward Assembly'} (${doc.county || 'Kenya'})
DOCUMENT TITLE: ${doc.title}
CATEGORY: ${doc.category}
DATE OF ASSEMBLY: ${doc.documentDate}
CERTIFIED BY: ${doc.uploadedBy || 'Ward Clerk / Secretariat'}

SUMMARY OF RESOLUTIONS & DELIBERATIONS:
------------------------------------------------------------
${doc.summary || 'Official deliberations ratified by participating community groups and wananchi.'}

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

  // Filtered list
  const filteredResolutions = resolutions.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.wardName && item.wardName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.county && item.county.toLowerCase().includes(searchQuery.toLowerCase()));

    const selectedWardObj = availableWards.find(w => w.id === selectedWardFilter);
    const matchesWard = 
      selectedWardFilter === 'All' || 
      item.wardId === selectedWardFilter || 
      (selectedWardObj && (
        (item.wardName && item.wardName.toLowerCase().trim() === selectedWardObj.name.toLowerCase().trim()) ||
        (item.wardId && item.wardId.toLowerCase().trim() === selectedWardObj.slug?.toLowerCase().trim())
      )) ||
      (item.wardName && item.wardName.toLowerCase() === selectedWardFilter.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesWard && matchesCategory;
  });

  return (
    <div id="ward-resolutions" className="scroll-mt-24 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-full border border-sky-200 mb-2">
              <FileCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Ratified Ward Deliberations & Charters</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-sky-950 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-sky-600" />
              Ward Assembly Resolutions
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Official resolutions and social audit matrices ratified by wananchi in ward citizen assemblies. Uploaded directly by <strong>Ward Clerks and Administrators</strong> for citizen follow-up, 12 Committee audits, and county executive oversight.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Post / Upload Ward Resolution</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-3 border-t border-stone-100 mt-6">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resolutions by keyword, ward, or topic..."
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
              value={selectedWardFilter}
              onChange={(e) => setSelectedWardFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800 font-medium"
            >
              <option value="All">All Electoral Wards</option>
              {availableWards.map(w => (
                <option key={w.id} value={w.id}>{w.name} Ward</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800 font-medium"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resolutions Grid or Empty State */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-3"></div>
          <p className="text-xs text-stone-500">Loading ratified ward assembly resolutions...</p>
        </div>
      ) : filteredResolutions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto text-sky-600">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-sky-950">No Ward Resolutions Found</h3>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              {searchQuery || selectedWardFilter !== 'All' || selectedCategory !== 'All'
                ? 'No resolutions matched your filter criteria. Try resetting filters.'
                : 'No official ward resolutions have been posted yet. Ward Clerks and Administrators can post or upload resolutions directly from the button above or on any ward page.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Post First Ward Resolution</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResolutions.map(item => {
            const wardSlug = item.wardName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'kangemi';
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Link
                      to={`/ward/${wardSlug}`}
                      className="inline-flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md transition-colors"
                    >
                      <MapPin className="w-3 h-3 text-sky-600" />
                      <span>{item.wardName || 'Ward'} Ward</span>
                    </Link>

                    <div className="flex items-center gap-1.5">
                      {item.isPinned && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400 font-medium">
                        {item.documentDate}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-sky-700 transition-colors line-clamp-2 mb-2 leading-snug">
                    {item.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                    {item.summary || 'Certified citizen assembly resolution ratified for implementation and executive oversight.'}
                  </p>
                </div>

                {/* Footer Meta & Actions */}
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" /> Certified Record
                    </span>
                    <span className="truncate max-w-[130px]" title={item.uploadedBy}>
                      {item.uploadedBy || 'Ward Clerk'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setPreviewDoc(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-600" />
                      <span>Read Text</span>
                    </button>
                    <button
                      onClick={(e) => handleDownload(item, e)}
                      className="inline-flex items-center justify-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-800 px-3 py-2 rounded-xl text-xs font-bold transition-colors border border-sky-200 cursor-pointer"
                      title="Download Certified Resolution Document"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-600" />
                      <span>Download</span>
                    </button>
                    <Link
                      to={`/ward/${wardSlug}#ward-documents`}
                      className="inline-flex items-center justify-center p-2 text-stone-400 hover:text-sky-600 hover:bg-stone-100 rounded-xl transition-colors"
                      title="Open Ward Wall"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL: POST / UPLOAD RESOLUTION */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsPostModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 text-white p-6 relative shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full uppercase font-bold border border-emerald-400/30">
                      Ward Clerk & Admin Console
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      Post / Upload Ward Resolution
                    </h3>
                    <p className="text-xs text-stone-300 mt-0.5">
                      Published resolutions immediately show in this section and on the Ward Wall.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPostModalOpen(false)}
                    className="p-2 text-stone-400 hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handlePostSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">
                    {formError}
                  </div>
                )}

                {/* Ward Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Select Ward <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formWardId}
                      onChange={(e) => {
                        const wId = e.target.value;
                        setFormWardId(wId);
                        const matched = availableWards.find(w => w.id === wId);
                        if (matched) {
                          setFormWardName(matched.name);
                          setFormCounty(matched.description?.split('-')[0]?.trim() || 'Nairobi');
                        }
                      }}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900 font-medium"
                    >
                      {availableWards.map(w => (
                        <option key={w.id} value={w.id}>{w.name} Ward</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Assembly Ratification Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Resolution Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Kangemi Water Supply Rationing Schedule & Clean Kiosk Subsidies"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Document Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
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
                      Officiating Clerk / Officer Name
                    </label>
                    <input
                      type="text"
                      value={formOfficerName}
                      onChange={(e) => setFormOfficerName(e.target.value)}
                      placeholder="e.g. Ward Clerk / Presiding Official"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Summary of Resolutions & Deliberations
                  </label>
                  <textarea
                    rows={4}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Detail the agreed resolutions, budgetary allocations demanded, assigned committee, and deadlines..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900 leading-relaxed"
                  />
                </div>

                {/* File Attachment */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Attach Signed Document (Optional - PDF, Word, Scan)
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
                          className="text-stone-400 hover:text-red-500 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                        <span className="text-xs font-bold text-sky-700 hover:underline">
                          Choose signed resolution file
                        </span>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          PDF, DOCX, or scanned minutes (Max 15MB)
                        </p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="hp-pin"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <label htmlFor="hp-pin" className="text-xs text-stone-700 font-medium">
                    Pin as Landmark Resolution (highlighted on Ward & Homepage)
                  </label>
                </div>

                </div>

                {/* Fixed Sticky Footer with Submit Button - Always Visible */}
                <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 shrink-0 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? 'Submitting & Publishing...' : 'Submit & Publish Resolution'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: READ FULL RESOLUTION */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPreviewDoc(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 text-white p-6 relative shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs uppercase tracking-wider font-bold text-sky-200">
                      Official Certified Record
                    </span>
                  </div>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 text-stone-400 hover:text-white rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-white mt-2 leading-snug">
                  {previewDoc.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-sky-200 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {previewDoc.wardName || 'Ward'} Ward, {previewDoc.county || 'Kenya'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {previewDoc.documentDate}
                  </span>
                  <span>•</span>
                  <span>{previewDoc.category}</span>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Summary of Resolutions & Deliberations
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                    {previewDoc.summary || 'Official deliberations ratified by the citizen assembly.'}
                  </div>
                </div>

                <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-sky-900 font-bold block">
                      Certified By: {previewDoc.uploadedBy || 'Ward Assembly Secretariat'}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      Archived on {new Date(previewDoc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Record</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
                <Link
                  to={`/ward/${previewDoc.wardName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}#ward-documents`}
                  className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1"
                >
                  <span>Go to {previewDoc.wardName} Ward Wall</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
