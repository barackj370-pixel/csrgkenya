import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Calendar, ArrowLeft, Lightbulb, ThumbsUp, Plus, FileText, CheckCircle, Upload, ChevronDown, ChevronUp, X, ShieldCheck, Sparkles } from 'lucide-react';
import DiscussionCard from '../components/ui/DiscussionCard';
import JoinWardModal from '../components/ui/JoinWardModal';
import WardDocumentsSection from '../components/ui/WardDocumentsSection';
import WardGroupActivitiesSection from '../components/ui/WardGroupActivitiesSection';
import GroupWallExpanded from '../components/ui/GroupWallExpanded';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { KENYA_COUNTIES } from '../data/kenyaCountiesAndWards';

export default function WardPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [ward, setWard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Add Group Modal State for Clerk and Admin
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Agroecology & Smallholder Farmers');
  const [newGroupLeader, setNewGroupLeader] = useState('');
  const [newGroupPhone, setNewGroupPhone] = useState('');
  const [newGroupMeetingDay, setNewGroupMeetingDay] = useState('Every Saturday at 2:00 PM');
  const [newGroupVenue, setNewGroupVenue] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [groupSuccessMsg, setGroupSuccessMsg] = useState('');

  useEffect(() => {
    const groupParam = searchParams.get('group');
    if (groupParam) {
      if (groupParam === 'grp-sikhendu-sibembe' || groupParam.toLowerCase().includes('sibembe')) {
        setExpandedGroup('grp-sikhendu-sibembe');
        setTimeout(() => {
          const el = document.getElementById('ward-groups-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      } else if (ward?.groups && ward.groups.length > 0) {
        const match = ward.groups.find((g: any) => 
          g.id === groupParam || 
          g.name.toLowerCase().includes(groupParam.toLowerCase())
        );
        if (match) {
          setExpandedGroup(match.id);
          setTimeout(() => {
            const el = document.getElementById('ward-groups-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 150);
        }
      }
    }
  }, [searchParams, ward]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !ward?.id) return;
    setIsSubmittingGroup(true);

    const leader = newGroupLeader.trim() || user?.name || 'Group Convener';
    const cleanId = `grp-${ward.slug || 'ward'}-${Date.now()}`;
    const groupData = {
      id: cleanId,
      name: newGroupName.trim(),
      wardId: ward.id,
      category: newGroupCategory,
      leaderName: leader,
      leaderRole: 'Group Leader & Convener',
      leaderPhone: newGroupPhone.trim() || undefined,
      meetingDay: newGroupMeetingDay.trim() || 'Every Saturday at 2:00 PM',
      venue: newGroupVenue.trim() || `${ward.name} Community Hall`,
      description: newGroupDescription.trim() || `${newGroupName.trim()} holding weekly community mini-caucuses before the National Citizen Assembly.`,
      memberCount: '1',
      members: newGroupPhone.trim() ? `${leader} (${newGroupPhone.trim()})` : leader
    };

    try {
      const { data } = await supabase.from('Group').insert([groupData]).select().single();
      const createdItem = data || groupData;
      setWard((prev: any) => ({
        ...prev,
        groups: [...(prev.groups || []), createdItem]
      }));
      setExpandedGroup(createdItem.id);
      setIsAddGroupModalOpen(false);
      setGroupSuccessMsg(`Successfully registered ${createdItem.name} under ${ward.name} Ward!`);
      setTimeout(() => setGroupSuccessMsg(''), 5000);

      // Reset form
      setNewGroupName('');
      setNewGroupLeader('');
      setNewGroupPhone('');
      setNewGroupVenue('');
      setNewGroupDescription('');

      // Notify Navbar and other listeners to refresh dropdown
      window.dispatchEvent(new Event('csrg_group_created'));
    } catch (err) {
      console.warn('Failed to insert group', err);
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const [newIssue, setNewIssue] = useState({ title: '', description: '' });
  const brainstormIssues = ward?.issues || [];
  
  // Filter legitimate ward groups: in Sikhendu Ward, Sibembe Food Coop is the legitimate group
  const isSikhendu = ward?.slug === 'sikhendu' || ward?.name?.toLowerCase() === 'sikhendu' || ward?.id === 'ward-7' || ward?.slug === 'shikendu';

  let rawWardGroups = ward?.groups || [];
  // Ensure Sibembe Food Coop is ALWAYS present under Sikhendu Ward (1 group, not 0)
  if (isSikhendu && !rawWardGroups.some((g: any) => g.id === 'grp-sikhendu-sibembe' || g.id === 'grp-shikendu-sibembe' || (g.name && g.name.toLowerCase().includes('sibembe')))) {
    rawWardGroups = [
      {
        id: 'grp-sikhendu-sibembe',
        name: 'Sibembe Food Coop',
        wardId: ward?.id || 'ward-7',
        category: 'Agroecology & Food Sovereignty Cooperative',
        description: 'Grassroots food cooperative and peasant community caucus in Sibembe, Sikhendu Ward (Trans Nzoia County). Held 2-hour citizen mini-caucus on Tuesday, October 20, 2026 (10:00 AM – 12:00 PM) consolidating wananchi issues and resolutions for the December 10 National Assembly.',
        leaderName: 'Irene Nyongesa',
        leaderRole: 'Group Leader & Convener',
        leaderPhone: '',
        meetingDay: 'Tuesday Oct 20, 2026 at 10:00 AM – 12:00 PM (2-Hour Citizen Deliberation)',
        meetingFrequency: 'Weekly Food Coop Caucus',
        memberCount: '1',
        members: 'Irene Nyongesa (Group Leader)',
        subTeams: []
      },
      ...rawWardGroups
    ];
  }

  const wardGroups = rawWardGroups.filter((group: any) => {
    if (!group) return false;
    const gName = (group.name || '').toLowerCase();
    const gDesc = (group.description || '').toLowerCase();
    if (gName.includes('sikhendu agroecology') || gName.includes('farmers cooperative') || gDesc.includes('farmers cooperative')) {
      return false;
    }
    if (isSikhendu) {
      return group.id === 'grp-sikhendu-sibembe' || group.id === 'grp-shikendu-sibembe' || gName.includes('sibembe');
    }
    return true;
  });

  // Get top 2 issues
  const topIssues = [...brainstormIssues].sort((a: any, b: any) => b.votes - a.votes).slice(0, 2);
  
  // Filter past assemblies
  const pastAssemblies = ward?.discussions?.filter((d: any) => d.status === 'CLOSED') || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, groupId: string, currentMembers: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const newNames = text.split(/\r?\n/).map(name => name.trim()).filter(name => name.length > 0);
        const existingNames = currentMembers ? currentMembers.split(',').map(n => n.trim()) : [];
        
        const allNames = Array.from(new Set([...existingNames, ...newNames]));
        const membersString = allNames.join(', ');
        
        // Update in Supabase
        try {
          await supabase.from('Group').update({
            members: membersString,
            memberCount: allNames.length.toString()
          }).eq('id', groupId);
          
          // Update local state
          setWard((prev: any) => ({
            ...prev,
            groups: prev.groups.map((g: any) => g.id === groupId ? {
              ...g,
              members: membersString,
              memberCount: allNames.length.toString()
            } : g)
          }));
        } catch (err) {
          console.warn('Failed to update group members', err);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };


  useEffect(() => {
    async function fetchWard() {
      try {
        let { data } = await supabase
          .from('Ward')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        // If not found in database, check if it matches any Kenyan ward from our comprehensive dataset
        if (!data && slug) {
          for (const county of KENYA_COUNTIES) {
            const matchedName = county.wards.find(w => 
              w.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug ||
              w.toLowerCase() === slug.toLowerCase()
            );
            if (matchedName) {
              let { data: createdWard, error: wardErr } = await supabase
                .from('Ward')
                .insert([{
                  name: matchedName,
                  slug: slug,
                  county: county.name,
                  description: `${county.name} County - ${matchedName} Ward`
                }])
                .select()
                .single();

              if (wardErr) {
                const fallback = await supabase
                  .from('Ward')
                  .insert([{
                    name: matchedName,
                    slug: slug,
                    description: `${county.name} County - ${matchedName} Ward`
                  }])
                  .select()
                  .single();
                createdWard = fallback.data;
              }

              if (createdWard) {
                data = createdWard;
              }
              break;
            }
          }
        }
          
        if (data) {
          const isSikhenduWard = data.slug === 'sikhendu' || data.name?.toLowerCase() === 'sikhendu' || data.id === 'ward-7' || data.slug === 'shikendu';

          // Fetch related data separately to avoid join errors if relations aren't perfectly set up
          const [issuesRes, discussionsRes, groupsRes] = await Promise.all([
            supabase.from('Issue').select('*').eq('wardId', data.id),
            supabase.from('Discussion').select('*').eq('wardId', data.id),
            supabase.from('Group').select('*').eq('wardId', data.id)
          ]);

          let finalGroups = groupsRes.data || [];
          if (isSikhenduWard && !finalGroups.some((g: any) => g.id === 'grp-sikhendu-sibembe' || g.id === 'grp-shikendu-sibembe' || (g.name && g.name.toLowerCase().includes('sibembe')))) {
            const allGroupsRes = await supabase.from('Group').select('*');
            const sibembe = (allGroupsRes.data || []).find((g: any) => g.id === 'grp-sikhendu-sibembe' || g.id === 'grp-shikendu-sibembe' || (g.name && g.name.toLowerCase().includes('sibembe')));
            if (sibembe) {
              finalGroups = [sibembe, ...finalGroups];
            } else {
              finalGroups = [
                {
                  id: 'grp-sikhendu-sibembe',
                  name: 'Sibembe Food Coop',
                  wardId: data.id || 'ward-7',
                  category: 'Agroecology & Food Sovereignty Cooperative',
                  description: 'Grassroots food cooperative and peasant community caucus in Sibembe, Sikhendu Ward (Trans Nzoia County). Held 2-hour citizen mini-caucus on Tuesday, October 20, 2026 (10:00 AM – 12:00 PM) consolidating wananchi issues and resolutions for the December 10 National Assembly.',
                  leaderName: 'Irene Nyongesa',
                  leaderRole: 'Group Leader & Convener',
                  leaderPhone: '',
                  meetingDay: 'Tuesday Oct 20, 2026 at 10:00 AM – 12:00 PM (2-Hour Citizen Deliberation)',
                  meetingFrequency: 'Weekly Food Coop Caucus',
                  memberCount: '1',
                  members: 'Irene Nyongesa (Group Leader)',
                  subTeams: []
                },
                ...finalGroups
              ];
            }
          }
          
          setWard({
            ...data,
            issues: issuesRes.data || [],
            discussions: discussionsRes.data || [],
            groups: finalGroups
          });
        }
      } catch (error) {
        console.warn('Failed to fetch ward', error);
      } finally {
        setLoading(false);
      }
    }
    fetchWard();
  }, [slug]);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN' || user.role === 'CLERK' || user.wardId === ward?.id || user.role === 'CITIZEN') {
        setHasJoined(true);
      }
    }
  }, [user, ward]);

  const handleJoinSuccess = () => {
    setHasJoined(true);
    setIsJoinModalOpen(false);
  };

  const handleVote = async (id: string) => {
    if (!hasJoined) {
      setIsJoinModalOpen(true);
      return;
    }
    
    const issueToVote = ward.issues.find((i: any) => i.id === id);
    if (!issueToVote) return;
    
    // Optimistic update
    setWard({
      ...ward,
      issues: ward.issues.map((issue: any) => 
        issue.id === id ? { ...issue, votes: issue.votes + 1 } : issue
      ).sort((a: any, b: any) => b.votes - a.votes)
    });

    try {
      const { error } = await supabase.rpc('increment_issue_votes', { issue_id: id });
      if (error) {
        // Fallback to update if RPC doesn't exist
        await supabase.from('Issue').update({ votes: issueToVote.votes + 1 }).eq('id', id);
      }
    } catch (error) {
      console.warn('Failed to vote', error);
    }
  };

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasJoined) {
      setIsJoinModalOpen(true);
      return;
    }
    if (newIssue.title && newIssue.description) {
      const issueToAdd = { title: newIssue.title, description: newIssue.description, wardId: ward.id, votes: 1 };
      
      try {
        const { data, error } = await supabase.from('Issue').insert([issueToAdd]).select().single();
        if (data) {
          setWard({
            ...ward,
            issues: [...(ward.issues || []), data].sort((a: any, b: any) => b.votes - a.votes)
          });
        }
      } catch (error) {
        console.warn('Failed to add issue', error);
      }
      setNewIssue({ title: '', description: '' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!ward) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-sky-950 mb-2">Ward Assembly Wall Not Activated Yet</h1>
        <p className="text-stone-600 max-w-md mb-6 text-sm">
          Be the first citizen or community organisation to activate the Citizen Assembly Wall for this ward. Registration is free and open to all 47 counties in Kenya.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            to={`/register?ward=${slug}`} 
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-full text-sm shadow-md transition-colors"
          >
            Register & Activate This Ward
          </Link>
          <Link 
            to="/" 
            className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium px-6 py-3 rounded-full text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen pb-24"
    >
      {/* Ward Header */}
      <div className="bg-sky-600 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-sky-300 to-sky-500"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold">{ward.name}</h1>
                <p className="text-xl text-stone-400 mt-2">{ward.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a 
                href="#ward-documents"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-full font-bold transition-all shadow-md flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Post / View Resolutions</span>
              </a>
              {!hasJoined ? (
                <button 
                  onClick={() => setIsJoinModalOpen(true)}
                  className="bg-white text-sky-800 px-6 py-3 rounded-full font-bold hover:bg-stone-100 transition-colors shadow-lg text-xs sm:text-sm"
                >
                  Join Ward as Citizen
                </button>
              ) : (
                <div className="bg-sky-500/20 text-green-400 border border-sky-500/30 px-5 py-3 rounded-full font-bold flex items-center gap-2 text-xs sm:text-sm">
                  <Users className="w-4 h-4" /> Joined as Citizen
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Users className="w-5 h-5 text-sky-400" />
              <span className="font-semibold">{wardGroups.length} Groups</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Calendar className="w-5 h-5 text-green-400" />
              <span className="font-semibold">{ward.discussions?.length || 0} Assemblies</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* ========================================================================= */}
        {/* 1. DEDICATED OFFICIAL DOCUMENTS, MINUTES & RESOLUTIONS (FIRST) */}
        {/* ========================================================================= */}
        <section id="ward-documents" className="scroll-mt-24">
          <WardDocumentsSection 
            wardId={ward.id} 
            wardName={ward.name} 
            wardCounty={ward.county} 
          />
        </section>

        {/* ========================================================================= */}
        {/* 2. KEY WARD ISSUES, TOP AGENDAS & REGISTERED COMMUNITY GROUPS */}
        {/* ========================================================================= */}
        <section className="pt-8 border-t border-stone-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left 2 Cols: Registered Groups & Mini-Caucuses */}
            <div className="lg:col-span-2 space-y-6" id="ward-groups-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-100 text-sky-800 rounded-2xl flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                        Dec 10 National Assembly Mini-Caucuses
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-sky-900">
                      Community Groups & Mini-Caucuses
                    </h2>
                    <p className="text-stone-500 text-xs sm:text-sm">
                      Grassroots groups in {ward.name} holding weekly mini-caucuses. Click any group to expand their wall to post issues, resolutions, share activities, and manage members.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsAddGroupModalOpen(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 border border-amber-300 cursor-pointer"
                    title="Clerk or Admin: Add a registered community group to this ward"
                  >
                    <Plus className="w-4 h-4 text-stone-950" />
                    <span>+ Add Group / Caucus</span>
                  </button>
                </div>
              </div>

              {groupSuccessMsg && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-in fade-in">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{groupSuccessMsg}</span>
                  </span>
                  <button onClick={() => setGroupSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950 cursor-pointer p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Groups Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wardGroups && wardGroups.length > 0 ? (
                    wardGroups.map((group: any) => {
                      const isExpanded = expandedGroup === group.id;
                      return (
                        <div 
                          key={group.id} 
                          className={`bg-white rounded-2xl border transition-all p-5 shadow-sm cursor-pointer ${
                            isExpanded 
                              ? 'border-sky-500 ring-2 ring-sky-100 shadow-md' 
                              : 'border-stone-200 hover:border-sky-300 hover:shadow-md'
                          }`}
                          onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit mb-1">
                                {group.category || 'Grassroots Mini-Caucus'}
                              </span>
                              <h4 className="text-lg font-black text-stone-900 group-hover:text-sky-800 leading-snug">
                                {group.name}
                              </h4>
                            </div>
                            <span className="bg-sky-50 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-full border border-sky-100 shrink-0">
                              {group.memberCount || (group.members ? group.members.split(',').length : 0)} Members
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-stone-600 mb-3">
                            <p className="font-semibold text-stone-700 flex items-center gap-1.5">
                              <span className="text-amber-500 font-bold">★ Head / Leader:</span>
                              {(() => {
                                const isSibembe = group.id === 'grp-sikhendu-sibembe' || group.id === 'grp-shikendu-sibembe' || group.name?.toLowerCase().includes('sibembe');
                                const isMock = (n: string) => {
                                  if (!n) return false;
                                  const l = n.toLowerCase();
                                  return l.includes('nyaboke') || l.includes('sarah') || l.includes('wanjiku') || l.includes('alice') || l.includes('bob');
                                };
                                const leaderName = isSibembe ? 'Irene Nyongesa' : (group.leaderName && !isMock(group.leaderName) ? group.leaderName : 'Pending registered leader');
                                const leaderRole = isSibembe ? 'Group Leader & Convener' : (group.leaderRole || 'Group Leader');
                                return <span>{leaderName} ({leaderRole})</span>;
                              })()}
                            </p>
                            <p className="text-stone-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              <span>{group.meetingDay || 'Every Saturday at 2:00 PM'}</span>
                            </p>
                            <p className="text-stone-500 line-clamp-2 italic">
                              "{group.description?.slice(0, 110) || 'Holding weekly community mini-caucuses before the Dec 10 National Assembly.'}..."
                            </p>
                          </div>

                          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-sky-700">
                            <span>
                              {isExpanded ? 'Hide Group Wall ▲' : 'Open Group Wall & Mini-Caucus Space ▼'}
                            </span>
                            <span className="text-stone-400 text-[10px] font-normal">
                              Issues • Resolutions • 🔴 Live Stream
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full bg-white p-8 rounded-2xl border border-dashed border-stone-300 text-center text-stone-500 shadow-2xs">
                      <Users className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                      <p className="text-base font-bold text-stone-800">No Groups Registered in {ward.name} Ward Yet</p>
                      <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                        In accordance with citizen assembly guidelines, only community groups added by a clerk or administrator appear here. In Sikhendu Ward, Sibembe Food Coop is registered; you can register a new group below.
                      </p>
                      <button
                        onClick={() => setIsAddGroupModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md border border-amber-300 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-stone-950" />
                        <span>+ Register Group / Caucus to {ward.name}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded Group Wall View */}
                {expandedGroup && (
                  <div className="pt-2">
                    {(() => {
                      const activeGrp = wardGroups.find((g: any) => g.id === expandedGroup);
                      if (!activeGrp) return null;
                      return (
                        <GroupWallExpanded
                          group={activeGrp}
                          wardName={ward.name}
                          wardCounty={ward.county}
                          onClose={() => setExpandedGroup(null)}
                          onUpdateGroup={(updated) => {
                            setWard((prev: any) => ({
                              ...prev,
                              groups: prev.groups.map((g: any) => g.id === updated.id ? updated : g)
                            }));
                          }}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Top 2 Voted Agendas */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-sky-800 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-sky-600" />
                Top Voted Agendas & Priorities
              </h2>
              <div className="space-y-4">
                {topIssues.length > 0 ? (
                  topIssues.map((issue: any, index: number) => (
                    <div key={issue.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                        #{index + 1}
                      </div>
                      <h4 className="text-lg font-bold text-sky-800 mb-2 pr-8">{issue.title}</h4>
                      <p className="text-sm text-stone-600 mb-4 line-clamp-3">{issue.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-stone-500">{issue.votes} Votes</span>
                        {user?.role === 'CLERK' && (
                          <button className="text-sm bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add to Assembly
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
                    No agendas proposed yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Ward Mini-Caucuses & Groups Activities Wall */}
        <section id="ward-group-activities" className="pt-8 border-t border-stone-200 scroll-mt-20">
          <WardGroupActivitiesSection 
            wardId={ward.id} 
            wardName={ward.name} 
            groups={wardGroups}
          />
        </section>

        {/* ========================================================================= */}
        {/* 3. BRAINSTORMING & CITIZEN DISCUSSION (BELOW SO USERS DON'T SCROLL A LOT) */}
        {/* ========================================================================= */}
        <section id="ward-brainstorming" className="pt-8 border-t border-stone-200 scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Brainstorming & Discussion */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-sky-800">Brainstorming & Citizen Discussion</h2>
                  <p className="text-stone-500 text-xs sm:text-sm">Propose up to 3 key issues. Vote to select the top 2 for the upcoming assembly.</p>
                </div>
              </div>

              {/* Add New Issue Form */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <h3 className="text-lg font-bold text-sky-800 mb-4">Propose a Key Issue</h3>
                <form onSubmit={handleAddIssue} className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      required
                      placeholder="Issue Title (e.g., Water Scarcity)"
                      value={newIssue.title}
                      onChange={e => setNewIssue({...newIssue, title: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <textarea 
                      required
                      placeholder="Describe the issue and why it needs to be discussed..."
                      value={newIssue.description}
                      onChange={e => setNewIssue({...newIssue, description: e.target.value})}
                      rows={3}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none resize-none"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="bg-sky-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-sky-700 transition-colors"
                  >
                    Submit Issue
                  </button>
                </form>
              </div>

              {/* Issues List */}
              <div className="space-y-4">
                {brainstormIssues.map((issue, index) => (
                  <div key={issue.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex gap-6 items-start relative overflow-hidden group">
                    {index < 2 && (
                      <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                        Top Issue
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => handleVote(issue.id)}
                        className="w-12 h-12 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-sky-800 transition-colors"
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </button>
                      <span className="font-bold text-sky-800 text-lg">{issue.votes}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-sky-800 mb-2">{issue.title}</h4>
                      <p className="text-stone-600 leading-relaxed">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Past Assemblies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-sky-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-stone-600" />
                  Past Assemblies
                </h3>
                <a 
                  href="#ward-documents"
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 underline"
                >
                  View Archive ↑
                </a>
              </div>
              <div className="space-y-4">
                {pastAssemblies.length > 0 ? (
                  pastAssemblies.map((discussion: any) => (
                    <DiscussionCard 
                      key={discussion.id} 
                      discussion={{...discussion, ward: { name: ward.name, slug: ward.slug }}} 
                    />
                  ))
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
                    No passed assemblies yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Clerk & Admin Modal: Register Group / Caucus for this Ward */}
      <AnimatePresence>
        {isAddGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    Clerk & Admin Action
                  </span>
                  <h4 className="text-xl font-black text-stone-900 mt-1">
                    Register Group / Caucus in {ward.name} Ward
                  </h4>
                  <p className="text-xs text-stone-500">
                    Groups added here will appear under {ward.name} in the Citizen Assemblies menu and on this Ward Wall.
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddGroupModalOpen(false)} 
                  className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Group / Caucus Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Sibembe Agroecology Community Group"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Caucus Category
                    </label>
                    <select
                      value={newGroupCategory}
                      onChange={(e) => setNewGroupCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="Agroecology & Smallholder Farmers">Agroecology & Smallholder Farmers</option>
                      <option value="Women Food Sovereignty Cooperative">Women Food Sovereignty Cooperative</option>
                      <option value="Youth Civic & Budget Oversight">Youth Civic & Budget Oversight</option>
                      <option value="Natural Resources & Water Protection">Natural Resources & Water Protection</option>
                      <option value="Grassroots Labor & Harambee">Grassroots Labor & Harambee</option>
                      <option value="General Ward Citizen Caucus">General Ward Citizen Caucus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Meeting Cadence
                    </label>
                    <input
                      type="text"
                      value={newGroupMeetingDay}
                      onChange={(e) => setNewGroupMeetingDay(e.target.value)}
                      placeholder="e.g. Every Saturday at 2:00 PM"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Leader / Convener Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newGroupLeader}
                      onChange={(e) => setNewGroupLeader(e.target.value)}
                      placeholder="e.g. Irene Nyongesa"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Leader Phone Number (Kenya)
                    </label>
                    <input
                      type="tel"
                      value={newGroupPhone}
                      onChange={(e) => setNewGroupPhone(e.target.value)}
                      placeholder="e.g. +254 712 345 678"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Meeting Venue in {ward.name}
                  </label>
                  <input
                    type="text"
                    value={newGroupVenue}
                    onChange={(e) => setNewGroupVenue(e.target.value)}
                    placeholder={`e.g. ${ward.name} Community Hall / Sibembe Grounds`}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Mandate & Description
                  </label>
                  <textarea
                    rows={2}
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder={`Describe the goals of this group in ${ward.name} Ward before the Dec 10 National Assembly...`}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsAddGroupModalOpen(false)}
                    className="px-4 py-2 text-stone-600 text-xs font-bold hover:bg-stone-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingGroup}
                    className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-md border border-amber-300 cursor-pointer flex items-center gap-2"
                  >
                    {isSubmittingGroup ? (
                      <span>Registering...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-stone-950" />
                        <span>Register Caucus to {ward.name}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <JoinWardModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        wardName={ward.name}
        wardId={ward.id}
        onSuccess={handleJoinSuccess}
      />
    </motion.div>
  );
}
