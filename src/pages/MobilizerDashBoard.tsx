import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, Plus, Save, Edit2, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MobilizerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'groups' | 'issues'>('groups');
  const [wards, setWards] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Group Form State
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    wardId: user?.role === 'MOBILIZER' ? (user.wardId || '') : '',
    leaderName: '',
    meetingDay: 'Monday',
    meetingFrequency: 'Weekly',
    memberCount: '',
    members: ''
  });

  // Issue Form State
  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const [editIssueId, setEditIssueId] = useState<string | null>(null);
  const [issueFormData, setIssueFormData] = useState({
    title: '',
    description: '',
    wardId: user?.role === 'MOBILIZER' ? (user.wardId || '') : ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [wardsRes, groupsRes, issuesRes] = await Promise.all([
        fetch('/api/wards'),
        fetch('/api/groups'),
        fetch('/api/issues')
      ]);
      const wardsData = await wardsRes.json();
      const groupsData = await groupsRes.json();
      const issuesData = await issuesRes.json();
      
      setWards(Array.isArray(wardsData) ? wardsData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setIssues(Array.isArray(issuesData) ? issuesData : []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }

  // --- Group Handlers ---
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editGroupId ? `/api/groups/${editGroupId}` : '/api/groups';
      const method = editGroupId ? 'PUT' : 'POST';

      const selectedWard = wards.find((w: any) => w.id === groupFormData.wardId);
      const wardName = selectedWard ? selectedWard.name : '';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...groupFormData,
          wardName
        })
      });
      if (res.ok) {
        setIsAddingGroup(false);
        setEditGroupId(null);
        setGroupFormData({
          name: '',
          wardId: '',
          leaderName: '',
          meetingDay: 'Monday',
          meetingFrequency: 'Weekly',
          memberCount: '',
          members: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save group', error);
    }
  };

  const handleEditGroup = (group: any) => {
    const ward = wards.find((w: any) => w.name === group.wardName);
    setGroupFormData({
      name: group.name,
      wardId: ward ? ward.id : (user?.role === 'MOBILIZER' ? (user.wardId || '') : ''),
      leaderName: group.leaderName,
      meetingDay: group.meetingDay,
      meetingFrequency: group.meetingFrequency,
      memberCount: group.memberCount.toString(),
      members: group.members
    });
    setEditGroupId(group.id);
    setIsAddingGroup(true);
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to delete group', error);
    }
  };

  const handleCancelGroup = () => {
    setIsAddingGroup(false);
    setEditGroupId(null);
    setGroupFormData({
      name: '',
      wardId: user?.role === 'MOBILIZER' ? (user.wardId || '') : '',
      leaderName: '',
      meetingDay: 'Monday',
      meetingFrequency: 'Weekly',
      memberCount: '',
      members: ''
    });
  };

  // --- Issue Handlers ---
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editIssueId ? `/api/issues/${editIssueId}` : '/api/issues';
      const method = editIssueId ? 'PUT' : 'POST';

      const selectedWard = wards.find((w: any) => w.id === issueFormData.wardId);
      const wardName = selectedWard ? selectedWard.name : '';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...issueFormData,
          wardName
        })
      });
      if (res.ok) {
        setIsAddingIssue(false);
        setEditIssueId(null);
        setIssueFormData({ title: '', description: '', wardId: user?.role === 'MOBILIZER' ? (user.wardId || '') : '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save issue', error);
    }
  };

  const handleEditIssue = (issue: any) => {
    const ward = wards.find((w: any) => w.name === issue.wardName);
    setIssueFormData({
      title: issue.title,
      description: issue.description,
      wardId: ward ? ward.id : (user?.role === 'MOBILIZER' ? (user.wardId || '') : '')
    });
    setEditIssueId(issue.id);
    setIsAddingIssue(true);
  };

  const handleDeleteIssue = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to delete issue', error);
    }
  };

  const handleCancelIssue = () => {
    setIsAddingIssue(false);
    setEditIssueId(null);
    setIssueFormData({ title: '', description: '', wardId: user?.role === 'MOBILIZER' ? (user.wardId || '') : '' });
  };

  // Filter data based on user role
  const mobilizerWardName = user?.role === 'MOBILIZER' 
    ? wards.find((w: any) => w.id === user.wardId)?.name 
    : null;

  const filteredGroups = user?.role === 'ADMIN' 
    ? groups 
    : groups.filter((g: any) => g.wardName === mobilizerWardName);

  const filteredIssues = user?.role === 'ADMIN' 
    ? issues 
    : issues.filter((i: any) => i.wardName === mobilizerWardName);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen py-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Mobilizer Portal</h1>
            <p className="text-stone-500 mt-1">Manage community groups and propose issues for the upcoming assembly.</p>
          </div>
          
          <div className="flex bg-stone-200 p-1 rounded-full">
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'groups' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Groups
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'issues' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Proposed Issues
            </button>
          </div>
        </div>

        {activeTab === 'groups' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-6">
              <a 
  href="https://docs.google.com/spreadsheets/d/1VgP-nmvXlmqsJOiy4sS_LPEjQmyjyWxVazK6Cc-PV-4/edit?gid=2025654152#gid=2025654152" 
  target="_blank" 
  rel="noopener noreferrer"
  className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium hover:bg-green-200 transition-colors flex items-center gap-2 text-sm"
>
  <Save className="w-4 h-4" /> View Google Sheet Report
</a>
              <button 
                onClick={() => isAddingGroup ? handleCancelGroup() : setIsAddingGroup(true)}
                className="bg-stone-900 text-white px-6 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2"
              >
                {isAddingGroup ? 'Cancel' : <><Plus className="w-4 h-4" /> Register Group</>}
              </button>
            </div>

            {isAddingGroup && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm mb-8"
              >
                <h2 className="text-xl font-bold text-stone-900 mb-6">
                  {editGroupId ? 'Edit Group' : 'Register New Group'}
                </h2>
                <form onSubmit={handleGroupSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Group Name</label>
                    <input 
                      required
                      type="text" 
                      value={groupFormData.name}
                      onChange={e => setGroupFormData({...groupFormData, name: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                      placeholder="e.g. Kangemi Youth Alliance"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Ward</label>
                    <select 
                      required
                      value={groupFormData.wardId}
                      onChange={e => setGroupFormData({...groupFormData, wardId: e.target.value})}
                      disabled={user?.role === 'MOBILIZER'}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none disabled:opacity-70 disabled:bg-stone-100"
                    >
                      <option value="">Select Ward...</option>
                      {wards.map((ward: any) => (
                        <option key={ward.id} value={ward.id}>{ward.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Group Leader Name</label>
                    <input 
                      required
                      type="text" 
                      value={groupFormData.leaderName}
                      onChange={e => setGroupFormData({...groupFormData, leaderName: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                      placeholder="Leader's full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Number of Members</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      value={groupFormData.memberCount}
                      onChange={e => setGroupFormData({...groupFormData, memberCount: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                      placeholder="e.g. 15"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Meeting Day</label>
                    <select 
                      required
                      value={groupFormData.meetingDay}
                      onChange={e => setGroupFormData({...groupFormData, meetingDay: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Meeting Frequency</label>
                    <select 
                      required
                      value={groupFormData.meetingFrequency}
                      onChange={e => setGroupFormData({...groupFormData, meetingFrequency: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-stone-700">Members List (Optional)</label>
                    <textarea 
                      value={groupFormData.members}
                      onChange={e => setGroupFormData({...groupFormData, members: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none"
                      rows={3}
                      placeholder="Comma separated list of member names..."
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end mt-4">
                    <button type="submit" className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition-colors flex items-center gap-2">
                      <Save className="w-5 h-5" /> {editGroupId ? 'Update Group' : 'Save Group'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Groups List */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-200">
                <h2 className="text-xl font-bold text-stone-900">Registered Groups</h2>
              </div>
              
              {loading ? (
                <div className="p-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
                </div>
              ) : groups.length === 0 ? (
                <div className="p-12 text-center text-stone-500">
                  No groups registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-500 text-sm">
                        <th className="p-4 font-medium">Group Name</th>
                        <th className="p-4 font-medium">Ward</th>
                        <th className="p-4 font-medium">Leader</th>
                        <th className="p-4 font-medium">Members</th>
                        <th className="p-4 font-medium">Meetings</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {filteredGroups.map((group: any) => (
                        <tr key={group.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-4 font-medium text-stone-900">{group.name}</td>
                          <td className="p-4 text-stone-600">
                            <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-md text-xs font-medium">
                              <MapPin className="w-3 h-3" /> {group.wardName || group.ward?.name}
                            </span>
                          </td>
                          <td className="p-4 text-stone-600">{group.leaderName}</td>
                          <td className="p-4 text-stone-600">
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-4 h-4 text-stone-400" /> {group.memberCount}
                            </span>
                          </td>
                          <td className="p-4 text-stone-600">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-stone-400" /> {group.meetingDay} ({group.meetingFrequency})
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleEditGroup(group)}
                                className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'issues' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => isAddingIssue ? handleCancelIssue() : setIsAddingIssue(true)}
                className="bg-stone-900 text-white px-6 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2"
              >
                {isAddingIssue ? 'Cancel' : <><Plus className="w-4 h-4" /> Propose Issue</>}
              </button>
            </div>

            {isAddingIssue && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm mb-8"
              >
                <h2 className="text-xl font-bold text-stone-900 mb-6">
                  {editIssueId ? 'Edit Issue' : 'Propose Issue for Assembly'}
                </h2>
                <form onSubmit={handleIssueSubmit} className="grid grid-cols-1 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Issue Title</label>
                    <input 
                      required
                      type="text" 
                      value={issueFormData.title}
                      onChange={e => setIssueFormData({...issueFormData, title: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                      placeholder="e.g. Broken water pipes in Section 4"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Ward</label>
                    <select 
                      required
                      value={issueFormData.wardId}
                      onChange={e => setIssueFormData({...issueFormData, wardId: e.target.value})}
                      disabled={user?.role === 'MOBILIZER'}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none disabled:opacity-70 disabled:bg-stone-100"
                    >
                      <option value="">Select Ward...</option>
                      {wards.map((ward: any) => (
                        <option key={ward.id} value={ward.id}>{ward.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">Description / Context</label>
                    <textarea 
                      required
                      value={issueFormData.description}
                      onChange={e => setIssueFormData({...issueFormData, description: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none"
                      rows={4}
                      placeholder="Provide details about why this issue needs to be discussed at the next assembly..."
                    />
                  </div>

                  <div className="flex justify-end mt-4">
                    <button type="submit" className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition-colors flex items-center gap-2">
                      <Save className="w-5 h-5" /> {editIssueId ? 'Update Issue' : 'Submit Issue'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Issues List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full p-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="col-span-full bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-500">
                  No issues proposed yet.
                </div>
              ) : (
                filteredIssues.map((issue: any) => (
                  <div key={issue.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-md text-xs font-medium text-stone-600">
                        <MapPin className="w-3 h-3" /> {issue.wardName || issue.ward?.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEditIssue(issue)}
                          className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteIssue(issue.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">{issue.title}</h3>
                    <p className="text-sm text-stone-600 line-clamp-3 mb-4">{issue.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-auto pt-4 border-t border-stone-100">
                      <AlertCircle className="w-3.5 h-3.5" /> Proposed for next assembly
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
