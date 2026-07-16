import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Calendar, ArrowLeft, Lightbulb, ThumbsUp, Plus, FileText, CheckCircle, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import DiscussionCard from '../components/ui/DiscussionCard';
import JoinWardModal from '../components/ui/JoinWardModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function WardPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [ward, setWard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const [newIssue, setNewIssue] = useState({ title: '', description: '' });
  const brainstormIssues = ward?.issues || [];
  
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
        const { data, error } = await supabase
          .from('Ward')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (data) {
          // Fetch related data separately to avoid join errors if relations aren't perfectly set up
          const [issuesRes, discussionsRes, groupsRes] = await Promise.all([
            supabase.from('Issue').select('*').eq('wardId', data.id),
            supabase.from('Discussion').select('*').eq('wardId', data.id),
            supabase.from('Group').select('*').eq('wardId', data.id)
          ]);
          
          setWard({
            ...data,
            issues: issuesRes.data || [],
            discussions: discussionsRes.data || [],
            groups: groupsRes.data || []
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
      <div className="min-h-screen flex flex-col justify-center items-center gap-4">
        <h1 className="text-3xl font-bold text-sky-800">Ward not found</h1>
        <Link to="/" className="text-sky-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
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
            {!hasJoined ? (
              <button 
                onClick={() => setIsJoinModalOpen(true)}
                className="bg-white text-sky-800 px-8 py-3 rounded-full font-bold hover:bg-stone-100 transition-colors shadow-lg"
              >
                Join Ward as Citizen
              </button>
            ) : (
              <div className="bg-sky-500/20 text-green-400 border border-sky-500/30 px-6 py-3 rounded-full font-bold flex items-center gap-2">
                <Users className="w-5 h-5" /> Joined as Citizen
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Users className="w-5 h-5 text-sky-400" />
              <span className="font-semibold">{ward.groups?.length || 0} Groups</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Calendar className="w-5 h-5 text-green-400" />
              <span className="font-semibold">{ward.discussions?.length || 0} Assemblies</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Brainstorming */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-sky-800">Brainstorming & Discussion</h2>
                  <p className="text-stone-500">Propose up to 3 key issues. Vote to select the top 2 for the upcoming assembly.</p>
                </div>
              </div>

              {/* Add New Issue Form */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm mb-8">
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

            {/* Registered Groups Section */}
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-sky-800">Registered Groups</h2>
                  <p className="text-stone-500">Community groups actively participating in {ward.name}.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ward.groups && ward.groups.length > 0 ? (
                  ward.groups.map((group: any) => (
                    <div 
                      key={group.id} 
                      className="bg-white rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden group/card cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-xl font-bold text-sky-800">{group.name}</h4>
                          <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2 py-1 rounded-md">{group.memberCount} Members</span>
                        </div>
                        <p className="text-sm font-medium text-stone-600 mb-2">Leader: {group.leaderName}</p>
                        <div className="flex items-center text-sm text-sky-600 font-medium">
                          {expandedGroup === group.id ? (
                            <><ChevronUp className="w-4 h-4 mr-1" /> Hide Members</>
                          ) : (
                            <><ChevronDown className="w-4 h-4 mr-1" /> View Members</>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedGroup === group.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-stone-100 bg-stone-50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking inside
                          >
                            <div className="p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Members List</p>
                                <label className="cursor-pointer bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Add via .txt/.csv</span>
                                  <input 
                                    type="file" 
                                    accept=".txt,.csv"
                                    onChange={(e) => handleFileUpload(e, group.id, group.members)}
                                    className="hidden" 
                                  />
                                </label>
                              </div>
                              
                              {group.members ? (
                                <ul className="list-disc pl-5 text-sm text-stone-600 space-y-1">
                                  {group.members.split(',').map((member: string, i: number) => (
                                    <li key={i}>{member.trim()}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-stone-500 italic">No members listed yet.</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
                    No groups registered yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Top 2 Voted Agendas */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-sky-600" />
              Top 2 Voted Agendas
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
            
            {/* Past Assemblies & Resolutions */}
            <div className="pt-8">
              <h2 className="text-2xl font-bold text-sky-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-stone-600" />
                Past Assemblies & Resolutions
              </h2>
              <div className="space-y-4">
                {pastAssemblies.length > 0 ? (
                  pastAssemblies.map((discussion: any) => (
                    <DiscussionCard 
                      key={discussion.id} 
                      discussion={{...discussion, ward: { name: ward.name, slug: ward.slug }}} 
                    />
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
                    No passed assemblies or resolutions yet.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <JoinWardModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        wardName={ward.name}
        onSuccess={handleJoinSuccess}
      />
    </motion.div>
  );
}
