import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User } from 'lucide-react';

interface JoinWardModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardName: string;
  onSuccess: () => void;
}

export default function JoinWardModal({ isOpen, onClose, wardName, onSuccess }: JoinWardModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/citizens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardName,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber
        })
      });
      alert(`Successfully joined ${wardName} as a Citizen!`);
      onSuccess();
    } catch (error) {
      alert('Failed to join. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            <h2 className="text-xl font-bold text-stone-900 mb-1 pr-8">
              Join {wardName}
            </h2>
            <p className="text-stone-500 text-xs mb-5">
              Register as a Citizen to participate in ward assemblies and vote on key issues.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    required
                    type="text" 
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                    placeholder="Enter Full Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    required
                    type="tel" 
                    value={formData.phoneNumber}
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                    placeholder="07XX XXX XXX"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-stone-800 transition-colors mt-4">
                Join as Citizen
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
