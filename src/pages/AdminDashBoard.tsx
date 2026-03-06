import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, MessageSquare, AlertTriangle, Plus, Settings, Trash2, Save } from 'lucide-react';

export default function AdminDashboard() {
  const [wards, setWards] = useState<any[]>([]);
  const [stats, setStats] = useState({
    wards: 0,
    discussions: 0,
    groups: 0
  });

  const [isAddingWard, setIsAddingWard] = useState(false);
  const [wardFormData, setWardFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  const fetchStats = async () => {
    try {
      const [wardsRes, discussionsRes] = await Promise.all([
        fetch('/api/wards'),
        fetch('/api/discussions')
      ]);
      const wardsData = await wardsRes.json();
      const discussionsData = await discussionsRes.json();
      
      const wardsArray = Array.isArray(wardsData) ? wardsData : [];
      const discussionsArray = Array.isArray(discussionsData) ? discussionsData : [];

      setWards(wardsArray);
      setStats({
        wards: wardsArray.length,
        discussions: discussionsArray.length,
        groups: wardsArray.reduce((acc: number, ward: any) => acc + (ward._count?.groups || 0), 0)
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleAddWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/wards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wardFormData)
      });
      if (res.ok) {
        setIsAddingWard(false);
        setWardFormData({ name: '', slug: '', description: '' });
        fetchStats();
      } else {
        const data = await res.json();
        alert(`Failed to add ward: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to add ward', error);
      alert('Failed to add ward. Please try again.');
    }
  };

  const handleDeleteWard = async (id: string) => {
    try {
      const res = await fetch(`/api/wards/${id}`, { method: 'DELETE' });
      if (res.ok) fetchStats();
    } catch (error) {
      console.error('Failed to delete ward', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen py-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Admin Dashboard</h1>
            <p className="text-stone-500 mt-1">Manage wards, discussions, and platform settings.</p>
          </div>
          <button className="bg-stone-900 text-white px-6 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Total Wards</p>
              <p className="text-2xl font-bold text-stone-900">{stats.wards}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Active Discussions</p>
              <p className="text-2xl font-bold text-stone-900">{stats.discussions}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Registered Groups</p>
              <p className="text-2xl font-bold text-stone-900">{stats.groups}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Wards Management */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">Manage Wards</h2>
              <button 
                onClick={() => setIsAddingWard(!isAddingWard)}
                className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 text-sm"
              >
                {isAddingWard ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Ward</>}
              </button>
            </div>
            <div className="p-6">
              {isAddingWard && (
                <form onSubmit={handleAddWard} className="mb-6 bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700">Ward Name</label>
                    <input 
                      required
                      type="text" 
                      value={wardFormData.name}
                      onChange={e => setWardFormData({...wardFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none mt-1"
                      placeholder="e.g. Kangemi"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700">Slug</label>
                    <input 
                      required
                      type="text" 
                      value={wardFormData.slug}
                      onChange={e => setWardFormData({...wardFormData, slug: e.target.value})}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none mt-1"
                      placeholder="e.g. kangemi"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700">Description</label>
                    <textarea 
                      required
                      value={wardFormData.description}
                      onChange={e => setWardFormData({...wardFormData, description: e.target.value})}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none mt-1 resize-none"
                      rows={2}
                      placeholder="Brief description of the ward..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Ward
                    </button>
                  </div>
                </form>
              )}

              <p className="text-stone-500 text-sm mb-4">
                Select a ward to edit its details, assign moderators, or view analytics.
              </p>
              <div className="space-y-3">
                {wards.length === 0 ? (
                  <div className="text-center text-stone-500 py-4">No wards found.</div>
                ) : (
                  wards.map((ward) => (
                    <div key={ward.id} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition-colors border border-transparent hover:border-stone-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-stone-900 block">{ward.name}</span>
                          <span className="text-xs text-stone-500">{ward.slug}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteWard(ward.id)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Ward"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Moderation Queue */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Moderation Queue
              </h2>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">3 Pending</span>
            </div>
            <div className="p-6">
              <p className="text-stone-500 text-sm mb-4">
                Review flagged comments and approve new moderator requests.
              </p>
              <div className="space-y-4">
                {/* Mock Flagged Item */}
                <div className="border border-red-100 bg-red-50/30 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Flagged Comment</span>
                    <span className="text-xs text-stone-500">10 mins ago</span>
                  </div>
                  <p className="text-sm text-stone-700 mb-3">
                    "This is a mock inappropriate comment that needs review..."
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-medium bg-white border border-stone-200 hover:bg-stone-50 px-3 py-1.5 rounded-md transition-colors">
                      Dismiss
                    </button>
                    <button className="text-xs font-medium bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-md transition-colors">
                      Delete Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
