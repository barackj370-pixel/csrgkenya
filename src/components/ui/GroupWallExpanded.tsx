import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Award, 
  Plus, 
  ThumbsUp, 
  Share2, 
  Check, 
  Image as ImageIcon, 
  FileText, 
  Upload, 
  ChevronRight, 
  Sparkles, 
  Download, 
  Clock, 
  MessageSquare, 
  X,
  UserCheck,
  UserPlus,
  Phone,
  Tag,
  FolderPlus,
  AlertCircle,
  Radio,
  Trash2,
  BookOpen,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Printer,
  Pin,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getGroupWallIssues, 
  saveGroupWallIssue, 
  voteGroupWallIssue, 
  updateGroupWallIssueStatus,
  deleteGroupWallIssue,
  getGroupWallResolutions, 
  saveGroupWallResolution, 
  supportGroupWallResolution,
  deleteGroupWallResolution,
  togglePinGroupWallResolution,
  getGroupActivities,
  saveGroupActivity,
  cheerGroupActivity,
  deleteGroupActivity,
  updateGroupRoster,
  sanitizeGroupAttribution,
  sanitizeGroupRole,
  GroupWallIssue,
  GroupWallResolution,
  GroupActivity
} from '../../lib/civicData';
import CitizenLiveStream from './CitizenLiveStream';

interface GroupWallExpandedProps {
  group: any;
  wardName: string;
  wardCounty?: string;
  onClose?: () => void;
  onUpdateGroup?: (updatedGroup: any) => void;
}

export default function GroupWallExpanded({
  group,
  wardName,
  wardCounty = 'Kenya',
  onClose,
  onUpdateGroup
}: GroupWallExpandedProps) {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'description' | 'issues' | 'resolutions' | 'activities' | 'members' | 'livestream'>('description');

  // Helper to detect mock names (e.g. Mama Sarah Nyaboke, Jane Wanjiku)
  const isMockPerson = (n?: string) => {
    if (!n) return false;
    const l = n.toLowerCase();
    return l.includes('nyaboke') || l.includes('sarah') || l.includes('wanjiku') || l.includes('alice') || l.includes('bob');
  };

  // Group Leader determination (Sibembe group leader is Irene Nyongesa; mock names removed for unregistered groups)
  const isSibembe = group.id === 'grp-sikhendu-sibembe' || group.id === 'grp-shikendu-sibembe' || group.name?.toLowerCase().includes('sibembe');
  const groupLeaderName = isSibembe 
    ? 'Irene Nyongesa' 
    : (group.leaderName && !isMockPerson(group.leaderName) ? group.leaderName : '');
  const groupLeaderRole = isSibembe 
    ? 'Group Leader & Convener' 
    : (group.leaderRole || 'Group Leader');
  
  // Data states
  const [issues, setIssues] = useState<GroupWallIssue[]>([]);
  const [resolutions, setResolutions] = useState<GroupWallResolution[]>([]);
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Group Leader Identification
  const [isLeaderOverride, setIsLeaderOverride] = useState(false);
  const [leaderIdentificationName, setLeaderIdentificationName] = useState(isSibembe ? 'Irene Nyongesa' : '');
  const [leaderAuthPassword, setLeaderAuthPassword] = useState('');
  const [leaderAuthError, setLeaderAuthError] = useState('');
  const [showLeaderAuthModal, setShowLeaderAuthModal] = useState(false);

  // Check leader or admin/clerk rights
  const isPlatformAdmin = user?.role === 'ADMIN';
  const isWardClerk = user?.role === 'CLERK' && (!user.wardId || user.wardId === group.wardId);
  const isLoggedLeader = user?.name && groupLeaderName && user.name.toLowerCase().includes(groupLeaderName.toLowerCase());
  const canPostAsLeader = isPlatformAdmin || isWardClerk || isLoggedLeader || isLeaderOverride;

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const isAdminOrClerk = user?.role === 'ADMIN' || user?.role === 'CLERK';
  const institutionalGroupAuthor = isSibembe ? 'Irene Nyongesa' : (groupLeaderName || 'Group Convener & Secretariat');
  const institutionalGroupRole = isSibembe ? 'Group Leader & Convener' : (groupLeaderRole || 'Group Convener & Secretariat');

  // Issue Form State
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSolution, setIssueSolution] = useState('');
  const [issueSubmitter, setIssueSubmitter] = useState(isAdminOrClerk ? institutionalGroupAuthor : (user?.name || institutionalGroupAuthor));
  const [issueStatus, setIssueStatus] = useState<GroupWallIssue['status']>('PROPOSED');

  // Resolution Form State
  const [resTitle, setResTitle] = useState('');
  const [resSummary, setResSummary] = useState('');
  const [resActionPoints, setResActionPoints] = useState('');
  const [resCertifier, setResCertifier] = useState(isAdminOrClerk ? institutionalGroupAuthor : (user?.name || institutionalGroupAuthor));
  const [resRole, setResRole] = useState(isAdminOrClerk ? institutionalGroupRole : (groupLeaderRole || 'Group Convener'));
  const [resFile, setResFile] = useState<File | null>(null);
  const [resFileUrl, setResFileUrl] = useState<string>('');
  const [resIsPinned, setResIsPinned] = useState(false);

  // Resolution Reader State
  const [readingResolution, setReadingResolution] = useState<GroupWallResolution | null>(null);
  const [expandedResIds, setExpandedResIds] = useState<Set<string>>(new Set());

  // Activity Form State
  const [actTitle, setActTitle] = useState('');
  const [actCategory, setActCategory] = useState<GroupActivity['category']>('Field Action & Harambee');
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);
  const [actVenue, setActVenue] = useState(`${wardName} Ward`);
  const [actDescription, setActDescription] = useState('');
  const [actOutcomes, setActOutcomes] = useState('');
  const [actParticipants, setActParticipants] = useState<number>(20);
  const [actImage, setActImage] = useState('');

  // Member Form State - Name & Phone Number only
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [inlineMemberName, setInlineMemberName] = useState('');
  const [inlineMemberPhone, setInlineMemberPhone] = useState('');
  const [addMemberSuccessMsg, setAddMemberSuccessMsg] = useState('');

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadGroupWallData();
  }, [group.id]);

  async function loadGroupWallData() {
    setLoading(true);
    const [fetchedIssues, fetchedRes, fetchedActs] = await Promise.all([
      getGroupWallIssues(group.id),
      getGroupWallResolutions(group.id),
      getGroupActivities(group.wardId, group.id)
    ]);

    setIssues(fetchedIssues);
    setResolutions(fetchedRes);
    setActivities(fetchedActs);
    setLoading(false);
  }

  // Voting on Issue
  const handleVoteIssue = async (id: string) => {
    const newVotes = await voteGroupWallIssue(id, group.id);
    setIssues(prev => prev.map(it => it.id === id ? { ...it, votes: newVotes } : it));
  };

  // Support Resolution
  const handleSupportResolution = async (id: string) => {
    const newCount = await supportGroupWallResolution(id, group.id);
    setResolutions(prev => prev.map(r => r.id === id ? { ...r, supportCount: newCount } : r));
  };

  // Cheer Activity
  const handleCheerActivity = async (id: string) => {
    const newCheers = await cheerGroupActivity(id);
    setActivities(prev => prev.map(a => a.id === id ? { ...a, cheersCount: newCheers } : a));
  };

  // Submit Issue
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDescription.trim()) return;

    const newIssue = await saveGroupWallIssue({
      groupId: group.id,
      wardId: group.wardId,
      groupName: group.name,
      wardName,
      title: issueTitle.trim(),
      description: issueDescription.trim(),
      proposedSolution: issueSolution.trim() || undefined,
      submittedBy: isAdminOrClerk ? institutionalGroupAuthor : (issueSubmitter.trim() || institutionalGroupAuthor),
      status: issueStatus || 'PROPOSED'
    });

    setIssues(prev => [newIssue, ...prev]);
    setIsIssueModalOpen(false);
    setIssueTitle('');
    setIssueDescription('');
    setIssueSolution('');
    setIssueStatus('PROPOSED');
  };

  // Update Status of an Issue (e.g. Mark as Passed Motion, Adopt as Resolution)
  const handleUpdateIssueStatus = async (issueId: string, newStatus: GroupWallIssue['status']) => {
    const cert = isSibembe ? 'Irene Nyongesa (Group Leader)' : (groupLeaderName ? `${groupLeaderName} (Group Convener)` : 'Group Convener & Secretariat');
    const updated = await updateGroupWallIssueStatus(issueId, group.id, newStatus, cert);
    if (updated) {
      setIssues(prev => prev.map(it => it.id === issueId ? { 
        ...it, 
        status: newStatus, 
        certifiedBy: cert, 
        passedAt: new Date().toISOString() 
      } : it));

      // If elevated to ADOPTED_RESOLUTION, also mirror into local resolutions list
      if (newStatus === 'ADOPTED_RESOLUTION') {
        const freshRes = await getGroupWallResolutions(group.id);
        setResolutions(freshRes);
      }
    }
  };

  const handleResolutionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setResFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete Resolution Handler
  const handleDeleteResolution = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resolution? It will be removed from this group wall, the ward page, and homepage resolutions.')) {
      await deleteGroupWallResolution(id, group.id);
      setResolutions(prev => prev.filter(r => r.id !== id));
    }
  };

  // Delete Issue Handler
  const handleDeleteIssue = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      await deleteGroupWallIssue(id, group.id);
      setIssues(prev => prev.filter(it => it.id !== id));
    }
  };

  // Delete Activity Handler
  const handleDeleteActivity = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      await deleteGroupActivity(id, group.id);
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  // Toggle inline expand resolution
  const toggleExpandRes = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedResIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle pin resolution
  const handleTogglePinRes = async (res: GroupWallResolution, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedPinned = await togglePinGroupWallResolution(res.id, group.id);
    setResolutions(prev => prev.map(r => r.id === res.id ? { ...r, isPinned: updatedPinned } : r));
  };

  // Download resolution document or generate signed certificate text
  const handleDownloadResolutionDoc = (res: GroupWallResolution, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (res.fileUrl) {
      const a = document.createElement('a');
      a.href = res.fileUrl;
      a.download = res.fileName || `${res.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const content = `=====================================================
KENYA CITIZEN STEERING RESOURCE GROUP (CSRG)
COUNTY & WARD PEOPLE'S ASSEMBLY RESOLUTION RECORD
=====================================================
RESOLUTION NO: ${res.resolutionNumber || 'RES-CAUCUS-2026'}
TITLE: ${res.title}
WARD: ${wardName} Ward, ${wardCounty}
GROUP / MINI-CAUCUS: ${group.name}
DATE OF RATIFICATION: ${res.adoptedDate}
CERTIFIED BY: ${res.certifiedBy} (${res.certifiedRole})
CITIZEN RATIFICATIONS: ${res.supportCount} Wananchi Signatories
STATUS: BINDING WANANCHI MANDATE FOR DEC 10 NATIONAL CITIZEN ASSEMBLY

-----------------------------------------------------
OFFICIAL RESOLUTION & MANDATE STATEMENT:
-----------------------------------------------------
${res.summary}

-----------------------------------------------------
MANDATORY ACTION POINTS FOR THE ASSEMBLY:
-----------------------------------------------------
${(res.actionPoints || []).map((pt, i) => `${i + 1}. ${pt}`).join('\n') || 'None recorded.'}

-----------------------------------------------------
VERIFICATION & CERTIFICATION SEAL:
This document is a certified grassroots public resolution ratified under Article 1 of the Constitution of Kenya (All sovereign power belongs to the people of Kenya).
Secretariat Archive ID: ${res.id}
Generated on: ${new Date().toLocaleString()}
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${res.title.replace(/[^a-zA-Z0-9]/g, '_')}_Official_Resolution.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Submit Resolution
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resSummary.trim()) return;

    const actions = resActionPoints
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const newRes = await saveGroupWallResolution({
      groupId: group.id,
      wardId: group.wardId,
      groupName: group.name,
      wardName,
      title: resTitle.trim(),
      summary: resSummary.trim(),
      actionPoints: actions.length > 0 ? actions : undefined,
      adoptedDate: new Date().toISOString().split('T')[0],
      certifiedBy: isAdminOrClerk ? institutionalGroupAuthor : (resCertifier.trim() || institutionalGroupAuthor),
      certifiedRole: isAdminOrClerk ? institutionalGroupRole : (resRole.trim() || institutionalGroupRole),
      fileUrl: resFileUrl || undefined,
      fileName: resFile?.name || undefined,
      isPinned: resIsPinned
    });

    setResolutions(prev => [newRes, ...prev]);
    setIsResolutionModalOpen(false);
    setResTitle('');
    setResSummary('');
    setResActionPoints('');
    setResFile(null);
    setResFileUrl('');
    setResIsPinned(false);
  };

  // Submit Activity
  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim() || !actDescription.trim()) return;

    const newAct = await saveGroupActivity({
      groupId: group.id,
      wardId: group.wardId,
      wardName,
      groupName: group.name,
      title: actTitle.trim(),
      category: actCategory,
      activityDate: actDate,
      venue: actVenue.trim() || `${wardName} Ward`,
      description: actDescription.trim(),
      keyOutcomes: actOutcomes.trim() || 'Successfully conducted community activity.',
      participantCount: Number(actParticipants) || 15,
      imageUrl: actImage || undefined,
      postedBy: isAdminOrClerk ? institutionalGroupAuthor : (user?.name || institutionalGroupAuthor)
    });

    setActivities(prev => [newAct, ...prev]);
    setIsActivityModalOpen(false);
    setActTitle('');
    setActDescription('');
    setActOutcomes('');
    setActImage('');
  };

  // Handle Image Upload for Activity
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setActImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Member to Roster (Name and Phone Number only)
  const handleAddMember = async (e?: React.FormEvent, customName?: string, customPhone?: string) => {
    if (e) e.preventDefault();
    const nameToAdd = (customName !== undefined ? customName : newMemberName).trim();
    const phoneToAdd = (customPhone !== undefined ? customPhone : newMemberPhone).trim();

    if (!nameToAdd) return;

    // Reject mock names
    if (isMockPerson(nameToAdd)) {
      alert('Please use real citizen names only. Mock names are not permitted.');
      return;
    }

    // Format member entry with phone number if provided
    const formattedEntry = phoneToAdd ? `${nameToAdd} (${phoneToAdd})` : nameToAdd;

    const currentNames = group.members ? group.members.split(',').map((n: string) => n.trim()).filter(Boolean) : [];
    
    // Check if duplicate
    if (currentNames.some((n: string) => n.toLowerCase().includes(nameToAdd.toLowerCase()))) {
      alert(`${nameToAdd} is already registered in the members list.`);
      return;
    }

    const updatedNames = [...currentNames, formattedEntry];
    const newMembersString = updatedNames.join(', ');
    const newCount = updatedNames.length.toString();

    await updateGroupRoster(group.id, newMembersString, newCount, group.subTeams);

    const updated = {
      ...group,
      leaderName: groupLeaderName,
      leaderRole: groupLeaderRole,
      members: newMembersString,
      memberCount: newCount
    };

    if (onUpdateGroup) {
      onUpdateGroup(updated);
    }

    setNewMemberName('');
    setNewMemberPhone('');
    setInlineMemberName('');
    setInlineMemberPhone('');
    setIsAddMemberModalOpen(false);
    setAddMemberSuccessMsg(`Added ${nameToAdd} (${phoneToAdd || 'No Phone'}) successfully!`);
    setTimeout(() => setAddMemberSuccessMsg(''), 4000);
  };

  // Upload Member Roster from TXT/CSV
  const handleRosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const fileNames = text
          .split(/\r?\n/)
          .map(n => n.trim())
          .filter(n => n.length > 0 && !isMockPerson(n));

        const existingNames = group.members ? group.members.split(',').map((n: string) => n.trim()).filter(Boolean) : [];
        const combined = Array.from(new Set([...existingNames, ...fileNames]));
        const newMembersString = combined.join(', ');
        const newCount = combined.length.toString();

        await updateGroupRoster(group.id, newMembersString, newCount, group.subTeams);

        const updated = {
          ...group,
          leaderName: groupLeaderName,
          leaderRole: groupLeaderRole,
          members: newMembersString,
          memberCount: newCount
        };

        if (onUpdateGroup) {
          onUpdateGroup(updated);
        }
        alert(`Successfully imported ${fileNames.length} names into ${group.name} roster!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Clean members list: strip mock names; ensure Sibembe leader Irene Nyongesa
  const rawMembers = group.members ? group.members.split(',').map((m: string) => m.trim()).filter(Boolean) : [];
  const cleanMembers = rawMembers.filter((m: string) => !isMockPerson(m));
  if (isSibembe && !cleanMembers.some((m: string) => m.includes('Irene Nyongesa'))) {
    cleanMembers.unshift('Irene Nyongesa (Group Leader)');
  }
  const membersArray = cleanMembers;

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden transition-all my-4">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-850 to-stone-900 text-white p-6 sm:p-8 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-400 text-stone-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Users className="w-3.5 h-3.5" /> Group Wall & Mini-Caucus
              </span>
              <span className="bg-sky-700/80 text-sky-200 text-xs font-bold px-3 py-1 rounded-full border border-sky-500/30">
                {group.category || 'Agroecology & Food Sovereignty'}
              </span>
              <span className="text-stone-300 text-xs font-medium">
                {wardName} Ward • {wardCounty}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              {group.name}
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-300">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Head / Leader: {groupLeaderName || 'Pending registered leader'} ({groupLeaderRole})</span>
              </div>
              <div className="flex items-center gap-1 text-stone-300">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Schedule: {group.meetingDay || 'Every Saturday at 2:00 PM'}</span>
              </div>
              <div className="flex items-center gap-1 text-stone-300">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{membersArray.length} Registered Members</span>
              </div>
            </div>
          </div>

          {/* Action Bar / High Visibility Add Member & Leader Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
            {/* VERY VISIBLE ADD MEMBER BUTTON */}
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg border border-amber-300 transition-all hover:scale-[1.02] cursor-pointer"
              title="Add member name and phone number"
            >
              <UserPlus className="w-4 h-4 text-stone-950" />
              <span>+ Add Member</span>
            </button>

            {canPostAsLeader ? (
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-1.5 rounded-xl text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Leader Rights Active</span>
              </div>
            ) : (
              <button
                onClick={() => setShowLeaderAuthModal(true)}
                className="inline-flex items-center gap-1.5 bg-sky-800/80 hover:bg-sky-700 text-sky-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-sky-600/60 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>I Am Group Leader</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Collapse Group Wall"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* National Citizen Assembly Countdown Note */}
        <div className="mt-4 pt-4 border-t border-sky-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-200">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-bold text-amber-300">Target Assembly:</span>
            <span>Upcoming National Citizen Assembly Summit on <strong>Thursday, December 10, 2026</strong></span>
          </div>
          <span className="text-stone-300 italic">Holding weekly mini-caucuses to present resolutions at the national summit</span>
        </div>
      </div>

      {/* Group Wall Navigation Tabs */}
      <div className="bg-stone-50 border-b border-stone-200 px-6 py-2 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('description')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'description'
              ? 'bg-sky-800 text-white shadow-sm'
              : 'text-stone-600 hover:text-sky-800 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>What We Do & Mandate</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'issues'
              ? 'bg-sky-800 text-white shadow-sm'
              : 'text-stone-600 hover:text-sky-800 hover:bg-stone-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Mini-Caucus Issues</span>
          <span className="bg-sky-700/20 text-sky-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
            {issues.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('resolutions')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'resolutions'
              ? 'bg-sky-800 text-white shadow-sm'
              : 'text-stone-600 hover:text-sky-800 hover:bg-stone-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Group Resolutions</span>
          <span className="bg-sky-700/20 text-sky-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
            {resolutions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'activities'
              ? 'bg-sky-800 text-white shadow-sm'
              : 'text-stone-600 hover:text-sky-800 hover:bg-stone-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Group Activities</span>
          <span className="bg-sky-700/20 text-sky-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
            {activities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-sky-800 text-white shadow-sm'
              : 'text-stone-600 hover:text-sky-800 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members Roster</span>
          <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full ml-1 shadow-xs">
            {membersArray.length}
          </span>
        </button>
      </div>

      {/* Quick Action Strip - Highly Visible Add Member Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-b border-amber-200/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-800">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="font-bold text-stone-900">
            {groupLeaderName ? `Group Leader: ${groupLeaderName} (${groupLeaderRole})` : 'Leadership: Pending registered account'}
          </span>
          <span className="text-stone-400 hidden sm:inline">•</span>
          <span className="text-stone-600 hidden sm:inline">Add members with name and phone number only</span>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {addMemberSuccessMsg && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1 shadow-xs">
              <Check className="w-3.5 h-3.5" /> {addMemberSuccessMsg}
            </span>
          )}

          {/* Quick Action Buttons for Clerk, Admin & Members */}
          <button
            onClick={() => {
              setIsIssueModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-800 font-bold px-3 py-1.5 rounded-xl text-xs shadow-2xs border border-stone-300 cursor-pointer transition-all"
            title="Post a mini-caucus issue or deliberation"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
            <span>+ Post Issue</span>
          </button>

          <button
            onClick={() => {
              setIsResolutionModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-800 font-bold px-3 py-1.5 rounded-xl text-xs shadow-2xs border border-stone-300 cursor-pointer transition-all"
            title="Adopt & certify a resolution for the Dec 10 National Assembly"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Post Resolution</span>
          </button>

          <button
            onClick={() => {
              setIsActivityModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-800 font-bold px-3 py-1.5 rounded-xl text-xs shadow-2xs border border-stone-300 cursor-pointer transition-all"
            title="Post a community action or photo"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Add Activity</span>
          </button>

          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-xs border border-amber-300 cursor-pointer transition-all"
            title="Add a member name and phone number"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Member</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8">

        {/* 1. DESCRIPTION & MANDATE TAB */}
        {activeTab === 'description' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-stone-50 to-sky-50/50 p-6 sm:p-8 rounded-2xl border border-stone-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-sky-100 text-sky-800 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-stone-900">
                    What We Do & Group Mandate in {wardName} Ward
                  </h4>
                  <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
                    {group.description || 
                      `Mobilizing grassroots wananchi across ${wardName} Ward to deliberate on localized community priorities, track devolved county budgets, and formulate resolutions for the upcoming National Citizen Assembly on December 10, 2026.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-teams / Action Committees */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
                <div className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-sky-600" />
                  <span>Mini-Caucus Cadence</span>
                </div>
                <p className="text-sm font-semibold text-stone-800">{group.meetingDay || 'Every Saturday 2:00 PM'}</p>
                <p className="text-xs text-stone-500">Weekly wananchi meetings to review community priorities before the Dec 10 National Assembly.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Leadership & Head</span>
                </div>
                <p className="text-sm font-semibold text-stone-800">
                  {groupLeaderName ? groupLeaderName : 'Pending registered leader (No mock names)'}
                </p>
                <p className="text-xs text-stone-500">
                  {groupLeaderRole} • {groupLeaderName ? 'Responsible for moderating discussions and submitting group resolutions.' : 'Sign in or register an account to claim leadership of this group.'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Organized Teams</span>
                </div>
                <p className="text-sm font-semibold text-stone-800">
                  {group.subTeams?.length ? `${group.subTeams.length} Active Committees` : 'Outreach, Agroecology & Audit Teams'}
                </p>
                <p className="text-xs text-stone-500">Sub-groups coordinating seed collection, budget audits, and assembly delegation.</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-amber-300"
              >
                <UserPlus className="w-4 h-4 text-stone-950" />
                <span>+ Add Group Member (Name & Phone)</span>
              </button>

              <button
                onClick={() => setActiveTab('issues')}
                className="bg-sky-800 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>View Mini-Caucus Issues</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('resolutions')}
                className="bg-stone-800 hover:bg-stone-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Read Group Resolutions</span>
              </button>

              <button
                onClick={() => setActiveTab('activities')}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Group Activities Feed</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. MINI-CAUCUS ISSUES TAB */}
        {activeTab === 'issues' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h4 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-sky-700" />
                  Mini-Caucus Deliberation Issues
                </h4>
                <p className="text-xs sm:text-sm text-stone-500">
                  Issues and wananchi petitions raised within {group.name} for presentation at the December 10 National Citizen Assembly.
                </p>
              </div>

              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="inline-flex items-center gap-2 bg-sky-800 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Post Group Issue</span>
              </button>
            </div>

            {issues.length === 0 ? (
              <div className="bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-8 text-center text-stone-500">
                <p className="text-sm">No group issues posted yet. Click "Post Group Issue" to submit a petition for the Dec 10 assembly.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {issues.map(issue => (
                  <div key={issue.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 hover:border-sky-300 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                            issue.status === 'PASSED_MOTION'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : issue.status === 'ADOPTED_RESOLUTION'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : issue.status === 'DELIBERATED' || issue.status === 'DELIBERATING'
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}>
                            {issue.status === 'PASSED_MOTION' && '✓ PASSED MOTION'}
                            {issue.status === 'ADOPTED_RESOLUTION' && '★ ADOPTED RESOLUTION'}
                            {(issue.status === 'DELIBERATED' || issue.status === 'DELIBERATING') && '🔵 DELIBERATED IN CAUCUS'}
                            {issue.status !== 'PASSED_MOTION' && issue.status !== 'ADOPTED_RESOLUTION' && issue.status !== 'DELIBERATED' && issue.status !== 'DELIBERATING' && '⚪ PROPOSED ISSUE'}
                          </span>
                          <span className="text-xs text-stone-400">
                            Submitted by {sanitizeGroupAttribution(issue.submittedBy, groupLeaderName)}
                          </span>
                        </div>
                        <h5 className="text-lg font-bold text-stone-900">{issue.title}</h5>
                      </div>

                      <button
                        onClick={() => handleVoteIssue(issue.id)}
                        className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-sky-600" />
                        <span>{issue.votes} Votes</span>
                      </button>
                    </div>

                    <p className="text-sm text-stone-700 leading-relaxed">{issue.description}</p>

                    {issue.proposedSolution && (
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900">
                        <strong className="font-bold text-emerald-800">Proposed Wananchi Solution: </strong>
                        {issue.proposedSolution}
                      </div>
                    )}

                    {/* Quick Status Management (Mark as Passed Motion, Adopt as Resolution) */}
                    <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-stone-400 font-semibold text-[11px]">Update Status:</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateIssueStatus(issue.id, 'PASSED_MOTION')}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                            issue.status === 'PASSED_MOTION'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          ✓ Mark Passed Motion
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateIssueStatus(issue.id, 'ADOPTED_RESOLUTION')}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                            issue.status === 'ADOPTED_RESOLUTION'
                              ? 'bg-amber-500 text-stone-950 font-black border-amber-500 shadow-xs'
                              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          ★ Adopt Resolution
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateIssueStatus(issue.id, 'DELIBERATED')}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                            issue.status === 'DELIBERATED' || issue.status === 'DELIBERATING'
                              ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                              : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                          }`}
                        >
                          Deliberated
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {issue.certifiedBy && (
                          <span className="text-[11px] text-stone-500 italic">
                            Certified by: {sanitizeGroupAttribution(issue.certifiedBy, groupLeaderName)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteIssue(issue.id)}
                          className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 px-2.5 py-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-red-200 text-xs"
                          title="Delete this issue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. GROUP RESOLUTIONS TAB */}
        {activeTab === 'resolutions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h4 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Mini-Caucus Resolutions & Petitions (Dec 10 Summit)
                </h4>
                <p className="text-xs sm:text-sm text-stone-500">
                  Official resolutions passed by {group.name} heading into the National Citizen Assembly on December 10, 2026.
                </p>
              </div>

              <button
                onClick={() => setIsResolutionModalOpen(true)}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Post Group Resolution</span>
              </button>
            </div>

            {resolutions.length === 0 ? (
              <div className="bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-8 text-center text-stone-500">
                <p className="text-sm">No group resolutions recorded yet. Group leaders or clerks can adopt resolutions for December 10.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...resolutions].sort((a, b) => {
                  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                  return new Date(b.createdAt || b.adoptedDate).getTime() - new Date(a.createdAt || a.adoptedDate).getTime();
                }).map(res => {
                  const isExpanded = expandedResIds.has(res.id);
                  return (
                    <div 
                      key={res.id} 
                      className={`p-6 rounded-2xl border-2 space-y-4 relative overflow-hidden transition-all shadow-xs hover:shadow-md ${
                        res.isPinned 
                          ? 'bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white border-amber-400 ring-2 ring-amber-300/40' 
                          : 'bg-stone-50/80 border-stone-200 hover:border-sky-300'
                      }`}
                    >
                      {res.isPinned && (
                        <div className="absolute top-0 right-0">
                          <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <Pin className="w-2.5 h-2.5 fill-stone-950" /> Pinned Priority
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pr-14">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Certified Resolution
                            </span>
                            {res.resolutionNumber && (
                              <span className="bg-stone-200 text-stone-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                                {res.resolutionNumber}
                              </span>
                            )}
                            <span className="text-xs text-stone-500">
                              Adopted on {res.adoptedDate}
                            </span>
                          </div>
                          <h5 
                            onClick={() => setReadingResolution(res)}
                            className="text-xl font-black text-stone-900 hover:text-amber-700 cursor-pointer transition-colors leading-snug"
                            title="Click to view and read full resolution"
                          >
                            {res.title}
                          </h5>
                        </div>

                        <button
                          onClick={() => handleSupportResolution(res.id)}
                          className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer shrink-0"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{res.supportCount} Wananchi Ratified</span>
                        </button>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-stone-200/80 space-y-2">
                        <p className={`text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {res.summary}
                        </p>
                        {res.summary.length > 140 && (
                          <button
                            type="button"
                            onClick={(e) => toggleExpandRes(res.id, e)}
                            className="text-xs font-black text-amber-800 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
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

                      {res.actionPoints && res.actionPoints.length > 0 && (
                        <div className="space-y-1.5 bg-stone-100/60 p-3 rounded-xl border border-stone-200">
                          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">Mandatory Action Points for Assembly:</p>
                          <ul className="list-disc pl-5 text-xs sm:text-sm text-stone-700 space-y-1">
                            {res.actionPoints.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
                        <span>Officiated by: <strong>{sanitizeGroupAttribution(res.certifiedBy, groupLeaderName)}</strong> ({sanitizeGroupRole(res.certifiedRole)})</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReadingResolution(res)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-3.5 py-1.5 rounded-xl border border-amber-300 font-bold flex items-center gap-1.5 text-xs transition-colors cursor-pointer shadow-2xs"
                            title="Read full resolution document and action points"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                            <span>Read Full Resolution</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadResolutionDoc(res, e)}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer text-xs"
                            title="Download official resolution file"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Download {res.fileName ? res.fileName : 'Document'}</span>
                          </button>

                          {canPostAsLeader && (
                            <button
                              type="button"
                              onClick={(e) => handleTogglePinRes(res, e)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                res.isPinned 
                                  ? 'bg-amber-400 text-stone-950 border-amber-500' 
                                  : 'bg-white text-stone-500 hover:bg-amber-50 border-stone-300'
                              }`}
                              title={res.isPinned ? 'Unpin from top' : 'Pin to top of resolutions'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${res.isPinned ? 'fill-stone-950' : ''}`} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteResolution(res.id)}
                            className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 px-2.5 py-1.5 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-red-200 text-xs"
                            title="Delete this resolution"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}



        {/* 5. GROUP ACTIVITIES TAB */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h4 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  {group.name} Activities Platform
                </h4>
                <p className="text-xs sm:text-sm text-stone-500">
                  Field actions, community harambee, public service audits, and training milestones shared by this specific group.
                </p>
              </div>

              <button
                onClick={() => setIsActivityModalOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Share Group Activity</span>
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-8 text-center text-stone-500">
                <p className="text-sm">No activities shared by this group yet. Click "Share Group Activity" to post field updates and photos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activities.map(act => (
                  <div key={act.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                    {act.imageUrl && (
                      <div className="h-48 overflow-hidden relative">
                        <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {act.category}
                        </span>
                      </div>
                    )}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" /> {act.activityDate}
                          </span>
                          <span className="flex items-center gap-1 text-stone-500 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" /> {act.venue}
                          </span>
                        </div>
                        <h5 className="text-lg font-bold text-stone-900 leading-snug">{act.title}</h5>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{act.description}</p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-stone-100">
                        {act.keyOutcomes && (
                          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-700">
                            <strong className="text-stone-900">Key Outcomes: </strong>
                            {act.keyOutcomes}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-400">
                            By {sanitizeGroupAttribution(act.postedBy, groupLeaderName)} • {act.participantCount} Wananchi
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCheerActivity(act.id)}
                              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                            >
                              <span>❤️</span>
                              <span>{act.cheersCount} Cheers</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(act.id)}
                              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 px-2.5 py-1 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-red-200 text-xs"
                              title="Delete this activity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. MEMBERS & ROSTER TAB */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h4 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-700" />
                  Group Members Roster ({membersArray.length} Members)
                </h4>
                <p className="text-xs sm:text-sm text-stone-500">
                  {groupLeaderName ? `Group Leader: ${groupLeaderName}.` : 'Leadership: Pending registration.'} You can add group members by entering their name and phone number only.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md border border-amber-300 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-stone-950" />
                  <span>+ Add Member</span>
                </button>

                <label className="cursor-pointer bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import .txt / .csv</span>
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleRosterFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Quick Inline Add Member Bar (Name & Phone Number Only) */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-white border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-stone-900">Add Group Member</h5>
                    <p className="text-xs text-stone-600">Register member with name and phone number only</p>
                  </div>
                </div>
                {addMemberSuccessMsg && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {addMemberSuccessMsg}
                  </span>
                )}
              </div>

              <form onSubmit={(e) => handleAddMember(e, inlineMemberName, inlineMemberPhone)} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    value={inlineMemberName}
                    onChange={(e) => setInlineMemberName(e.target.value)}
                    placeholder="Member Full Name *"
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>
                <div className="sm:col-span-4 relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={inlineMemberPhone}
                    onChange={(e) => setInlineMemberPhone(e.target.value)}
                    placeholder="Phone Number (e.g. 0712 345 678) *"
                    className="w-full bg-white pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-black py-2.5 px-3 rounded-xl text-xs sm:text-sm shadow-sm border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4 text-stone-950" />
                    <span>Add Member</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Sub-teams summary */}
            {group.subTeams && group.subTeams.length > 0 && (
              <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-2">
                <p className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Specialized Action Units & Sub-Committees:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.subTeams.map((st: any, idx: number) => (
                    <span key={idx} className="bg-white border border-sky-200 text-sky-900 text-xs font-medium px-3 py-1 rounded-lg shadow-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>{st.name}</span>
                      <strong className="text-sky-700 font-bold">({st.count || 1})</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Members Grid or Empty State */}
            {membersArray.length === 0 ? (
              <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center text-stone-500 shadow-xs">
                <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-800">No Registered Members Listed Yet</p>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  As citizens register in this ward or as the group leader adds member names and phone numbers, verified roster members will appear here. No unverified mock names are displayed.
                </p>
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md border border-amber-300 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-stone-950" />
                  <span>+ Add First Group Member</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {membersArray.map((member: string, i: number) => {
                  let cleanName = member;
                  let memberPhone = '';

                  const phoneMatch = member.match(/\(([\d\s+\-]+)\)/) || member.match(/[•\-]\s*([\d\s+\-]{9,15})/);
                  if (phoneMatch) {
                    memberPhone = phoneMatch[1].trim();
                    cleanName = member.replace(/\(([\d\s+\-]+)\)/, '').replace(/[•\-]\s*([\d\s+\-]{9,15})/, '').trim();
                  }

                  const isLeader = groupLeaderName && (
                    cleanName.toLowerCase().includes(groupLeaderName.toLowerCase()) || 
                    member.toLowerCase().includes(groupLeaderName.toLowerCase()) || 
                    member.includes('Leader')
                  );

                  return (
                    <div 
                      key={i} 
                      className={`p-3.5 rounded-2xl border transition-all shadow-xs flex items-center justify-between gap-3 ${
                        isLeader 
                          ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200' 
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                          isLeader ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 shadow-xs' : 'bg-sky-100 text-sky-800'
                        }`}>
                          {cleanName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs sm:text-sm font-bold text-stone-900 truncate flex items-center gap-1.5">
                            <span>{cleanName}</span>
                            {isLeader && (
                              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">Leader</span>
                            )}
                          </p>
                          {memberPhone ? (
                            <p className="text-xs font-semibold text-stone-600 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{memberPhone}</span>
                            </p>
                          ) : (
                            <p className="text-[10px] text-stone-500">
                              {isLeader ? `★ ${groupLeaderRole}` : 'Verified Group Member'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-md">
                          #{i + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. LIVE STREAM & PROCEEDINGS TAB */}
        {activeTab === 'livestream' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-red-950/80 via-stone-900 to-red-950/80 border border-red-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-red-200">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="font-black uppercase tracking-wider text-white text-sm">
                  Live Caucus Proceedings Floor
                </span>
                <span className="text-stone-300">• {group.name} ({wardName} Ward)</span>
              </div>
              <span className="text-amber-300 font-medium">
                Official Deliberation Stream for December 10 National Assembly
              </span>
            </div>

            <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-stone-800">
              <CitizenLiveStream
                groupId={group.id}
                groupName={group.name}
                wardName={wardName}
                leaderName={groupLeaderName || `${group.name} Convener`}
                isLeader={canPostAsLeader}
              />
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: POST GROUP ISSUE */}
      <AnimatePresence>
        {isIssueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-stone-900">Post Group Mini-Caucus Issue</h4>
                  <p className="text-xs text-stone-500">{group.name} • {wardName} Ward</p>
                </div>
                <button onClick={() => setIsIssueModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitIssue} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Issue / Deliberation Title *</label>
                  <input
                    type="text"
                    required
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="e.g., Shortage of clean water & desilting of community dam"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Deliberation Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe how this issue impacts the community and what was deliberated..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Proposed Wananchi Solution</label>
                  <input
                    type="text"
                    value={issueSolution}
                    onChange={(e) => setIssueSolution(e.target.value)}
                    placeholder="e.g., Allocate KES 1.2M from WDF for solar pumping installation"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Issue Status / Type</label>
                  <select
                    value={issueStatus}
                    onChange={(e) => setIssueStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="PROPOSED">⚪ Proposed Issue (Under Community Debate)</option>
                    <option value="DELIBERATED">🔵 Deliberated in Mini-Caucus</option>
                    <option value="PASSED_MOTION">✓ Passed Motion (Ratified by Caucus)</option>
                    <option value="ADOPTED_RESOLUTION">★ Adopted Resolution (For Dec 10 National Assembly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Submitted By (Name & Role)</label>
                  <input
                    type="text"
                    value={issueSubmitter}
                    onChange={(e) => setIssueSubmitter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsIssueModalOpen(false)}
                    className="px-4 py-2 text-stone-600 text-xs font-bold hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-800 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow cursor-pointer"
                  >
                    Submit Issue
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: POST GROUP RESOLUTION */}
      <AnimatePresence>
        {isResolutionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 sm:p-8 pb-4 border-b border-stone-100 shrink-0">
                <div>
                  <h4 className="text-xl font-bold text-stone-900">Post Mini-Caucus Resolution</h4>
                  <p className="text-xs text-stone-500">For December 10 National Citizen Assembly</p>
                </div>
                <button onClick={() => setIsResolutionModalOpen(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitResolution} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="p-6 sm:p-8 py-4 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Resolution Title *</label>
                    <input
                      type="text"
                      required
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      placeholder="e.g., Resolution on Establishing Community Seed Bank & Zero Synthetic Inputs"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Resolution Summary & Mandate *</label>
                    <textarea
                      required
                      rows={3}
                      value={resSummary}
                      onChange={(e) => setResSummary(e.target.value)}
                      placeholder="Provide the official agreed resolution statement..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Action Points (1 per line)</label>
                    <textarea
                      rows={3}
                      value={resActionPoints}
                      onChange={(e) => setResActionPoints(e.target.value)}
                      placeholder="1. Audit agrochemical subsidies&#10;2. Provide indigenous seeds to 200 peasant households&#10;3. Present to Dec 10 National Assembly Secretariat"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Document / PDF Upload Field */}
                  <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                        <span>Attach Resolution File / Signed Minutes (Optional)</span>
                      </span>
                      {resFile && (
                        <span className="text-emerald-700 font-bold text-[11px] truncate max-w-[180px]">
                          ✓ {resFile.name}
                        </span>
                      )}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={handleResolutionFileChange}
                      className="w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-300 file:text-stone-900 hover:file:bg-amber-400 cursor-pointer"
                    />
                    <p className="text-[10px] text-stone-500">
                      Upload signed minutes or stamped resolutions to make them downloadable by wananchi on this wall and ward page.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Certified By (Name)</label>
                      <input
                        type="text"
                        value={resCertifier}
                        onChange={(e) => setResCertifier(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Designation / Role</label>
                      <input
                        type="text"
                        value={resRole}
                        onChange={(e) => setResRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                    <input
                      type="checkbox"
                      id="grp-pin-res"
                      checked={resIsPinned}
                      onChange={(e) => setResIsPinned(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="grp-pin-res" className="text-xs text-stone-800 font-bold cursor-pointer flex items-center gap-1.5">
                      <Pin className="w-3.5 h-3.5 text-amber-700" />
                      <span>Pin as Landmark Priority (features at top of Group Wall, Ward Wall & Homepage)</span>
                    </label>
                  </div>
                </div>

                {/* Fixed Sticky Footer with Submit Button - Always Visible */}
                <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 shrink-0 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsResolutionModalOpen(false)}
                    className="px-4 py-2 text-stone-600 text-xs font-bold hover:bg-stone-200 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Submit & Adopt Resolution</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: SHARE GROUP ACTIVITY */}
      <AnimatePresence>
        {isActivityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-stone-900">Share Group Activity</h4>
                  <p className="text-xs text-stone-500">{group.name}</p>
                </div>
                <button onClick={() => setIsActivityModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitActivity} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Activity Title *</label>
                  <input
                    type="text"
                    required
                    value={actTitle}
                    onChange={(e) => setActTitle(e.target.value)}
                    placeholder="e.g., Community Compost Making & Indigenous Tree Planting"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                    <select
                      value={actCategory}
                      onChange={(e) => setActCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Field Action & Harambee">Field Action & Harambee</option>
                      <option value="Citizen Caucus Meeting">Citizen Caucus Meeting</option>
                      <option value="Public Service Inspection">Public Service Inspection</option>
                      <option value="Agroecology & Kitchen Gardens">Agroecology & Kitchen Gardens</option>
                      <option value="Youth & Women Empowerment">Youth & Women Empowerment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={actDate}
                      onChange={(e) => setActDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Venue / Location</label>
                    <input
                      type="text"
                      value={actVenue}
                      onChange={(e) => setActVenue(e.target.value)}
                      placeholder="e.g. Masaba Chief's Camp"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Participants Count</label>
                    <input
                      type="number"
                      value={actParticipants}
                      onChange={(e) => setActParticipants(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows={2}
                    value={actDescription}
                    onChange={(e) => setActDescription(e.target.value)}
                    placeholder="Describe what occurred, who attended, and key discussions..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Key Outcomes & Resolutions</label>
                  <input
                    type="text"
                    value={actOutcomes}
                    onChange={(e) => setActOutcomes(e.target.value)}
                    placeholder="e.g. Prepared 2 bokashi piles, recruited 8 new farmers"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Attach Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="w-full text-xs text-stone-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(false)}
                    className="px-4 py-2 text-stone-600 text-xs font-bold hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow cursor-pointer"
                  >
                    Publish Activity
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: ADD MEMBER (Name and Phone Number Only) */}
      <AnimatePresence>
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    <span>Add Member to {group.name}</span>
                  </h4>
                  <p className="text-xs text-stone-500">Group leader member roster (Name & Phone Number only)</p>
                </div>
                <button onClick={() => setIsAddMemberModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Member Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Member Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      placeholder="e.g. 0712 345 678 or +254 7..."
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">Used by the group leader for mini-caucus mobilization and updates.</p>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(false)}
                    className="px-4 py-2 text-stone-600 text-xs font-bold hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-md border border-amber-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-stone-950" />
                    <span>Save Group Member</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: IDENTIFY AS GROUP LEADER */}
      <AnimatePresence>
        {showLeaderAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-stone-900">Group Head / Leader Verification</h4>
                  <p className="text-xs text-stone-500">{group.name}</p>
                </div>
                <button onClick={() => setShowLeaderAuthModal(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                As the designated leader or convener of this group, you have full privileges to post mini-caucus issues, adopt group resolutions, share activities, and manage the member list with name and phone number.
              </p>

              <div className="space-y-3 pt-2">
                {isSibembe && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900">
                    <p className="font-bold flex items-center gap-1.5 text-stone-900">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Designated Group Leader: Irene Nyongesa</span>
                    </p>
                    <p className="text-[11px] text-stone-600 mt-1">
                      Enter your password below to activate and link your registered leader account for Sibembe Food Coop in Sikhendu Ward.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Your Name as Leader</label>
                  <input
                    type="text"
                    value={leaderIdentificationName}
                    onChange={(e) => setLeaderIdentificationName(e.target.value)}
                    placeholder={groupLeaderName || 'Enter your registered full name'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Account Password (Optional / Quick Sign-In)</label>
                  <input
                    type="password"
                    value={leaderAuthPassword}
                    onChange={(e) => setLeaderAuthPassword(e.target.value)}
                    placeholder="Enter your chosen password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const finalName = leaderIdentificationName.trim() || (isSibembe ? 'Irene Nyongesa' : 'Group Leader');
                    if (leaderAuthPassword || isSibembe) {
                      login('mock-jwt-leader', {
                        id: isSibembe ? 'user-irene-nyongesa' : `user-${Date.now()}`,
                        name: finalName,
                        phone: '0700000000',
                        role: 'CITIZEN',
                        wardId: group.wardId || 'ward-7',
                        village: isSibembe ? 'Sibembe' : 'Village',
                        organizationName: group.name
                      });
                    }
                    setIsLeaderOverride(true);
                    setShowLeaderAuthModal(false);
                    if (!groupLeaderName || isSibembe) {
                      const updated = {
                        ...group,
                        leaderName: finalName,
                        leaderRole: 'Group Leader & Convener'
                      };
                      updateGroupRoster(group.id, updated.members || '', updated.memberCount || '0', updated.subTeams);
                      if (onUpdateGroup) onUpdateGroup(updated);
                    }
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-black py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Activate Leader Rights</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 6: READ FULL RESOLUTION DOCUMENT & MANDATE */}
      <AnimatePresence>
        {readingResolution && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReadingResolution(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
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
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-full uppercase font-black border border-emerald-400/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Certified Resolution</span>
                      </span>
                      {readingResolution.resolutionNumber && (
                        <span className="text-[10px] bg-stone-800 text-stone-200 font-mono font-bold px-2.5 py-1 rounded-full border border-stone-700">
                          {readingResolution.resolutionNumber}
                        </span>
                      )}
                      {readingResolution.isPinned && (
                        <span className="text-[10px] bg-amber-400 text-stone-950 px-2.5 py-1 rounded-full uppercase font-black flex items-center gap-1 shadow-xs">
                          <Pin className="w-2.5 h-2.5 fill-stone-950" /> Pinned Landmark Priority
                        </span>
                      )}
                      <span className="text-xs text-amber-300 font-bold">
                        {group.name} • {wardName} Ward ({wardCounty})
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                      {readingResolution.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300">
                      <span>Adopted on: <strong>{readingResolution.adoptedDate}</strong></span>
                      <span>•</span>
                      <span>Certified by: <strong>{sanitizeGroupAttribution(readingResolution.certifiedBy, groupLeaderName)}</strong> ({sanitizeGroupRole(readingResolution.certifiedRole)})</span>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">{readingResolution.supportCount} Wananchi Ratifications</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setReadingResolution(null)}
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
                {readingResolution.fileUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                      <span className="flex items-center gap-1.5 text-sky-900">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span>Attached Document Viewer ({readingResolution.fileName || 'Resolution Document'})</span>
                      </span>
                      <a
                        href={readingResolution.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 hover:text-sky-900 font-extrabold flex items-center gap-1 hover:underline"
                      >
                        <span>Open Full Screen in New Tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="rounded-2xl border-2 border-stone-300 overflow-hidden bg-stone-900 shadow-sm">
                      {readingResolution.fileUrl.startsWith('data:image') ? (
                        <div className="p-3 bg-stone-100 text-center">
                          <img
                            src={readingResolution.fileUrl}
                            alt={readingResolution.title}
                            className="max-h-[500px] w-auto mx-auto rounded-xl object-contain shadow-xs"
                          />
                        </div>
                      ) : (
                        <iframe
                          src={readingResolution.fileUrl}
                          className="w-full h-[450px] bg-white border-0"
                          title={readingResolution.title}
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
                        const copyContent = `${readingResolution.title}\nResolution No: ${readingResolution.resolutionNumber || 'RES-CAUCUS-2026'}\nAdopted: ${readingResolution.adoptedDate}\nWard: ${wardName} Ward\nGroup: ${group.name}\nCertified By: ${sanitizeGroupAttribution(readingResolution.certifiedBy, groupLeaderName)} (${sanitizeGroupRole(readingResolution.certifiedRole)})\n\nMandate Statement:\n${readingResolution.summary}\n\nAction Points:\n${(readingResolution.actionPoints || []).map((pt, i) => `${i + 1}. ${pt}`).join('\n')}`;
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
                    {readingResolution.summary}
                  </div>
                </div>

                {/* 3. Mandatory Action Points */}
                {readingResolution.actionPoints && readingResolution.actionPoints.length > 0 && (
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-3 shadow-xs">
                    <h4 className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Mandatory Action Points for December 10 National Assembly</span>
                    </h4>
                    <div className="space-y-2 pt-1">
                      {readingResolution.actionPoints.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Archival Metadata & Certification Seal */}
                <div className="bg-gradient-to-r from-amber-500/10 via-stone-50 to-emerald-500/10 border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h5 className="text-sm font-extrabold text-stone-900">Certified Grassroots Wananchi Mandate</h5>
                      <p className="text-xs text-stone-600">
                        Ratified under Article 1 of the Constitution of Kenya for submission to the National Assembly Secretariat.
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-stone-500 shrink-0">
                    <p className="font-bold text-stone-800">Archive ID: {readingResolution.id}</p>
                    <p>Status: Ratified by Consensus</p>
                  </div>
                </div>
              </div>

              {/* Reader Sticky Footer */}
              <div className="p-4 sm:p-5 bg-white border-t border-stone-200 shrink-0 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Resolution</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDownloadResolutionDoc(readingResolution, e)}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReadingResolution(null)}
                    className="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
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
