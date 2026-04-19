import React, { useState } from 'react';
import { Send, Globe2, Landmark, Building2, Map } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';

const AddressForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    village: '',
    subDistrict: '',
    district: '',
    state: '',
    country: 'India'
  });

  const handleVillageSelect = (village: any) => {
    setFormData(prev => ({
      ...prev,
      village: village.name,
      subDistrict: village.subDistrict.name,
      district: village.subDistrict.district.name,
      state: village.subDistrict.district.state.name
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Final Submission:', formData);
    alert('Form submitted with auto-filled village data!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-600 outline-none transition-all"
            placeholder="John Doe"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
          <input
            type="email"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-600 outline-none transition-all"
            placeholder="john@example.com"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
      </div>

      {/* Village Autocomplete */}
      <AutocompleteInput onSelect={handleVillageSelect} />

      {/* Auto-filled Section */}
      <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <Globe2 size={120} />
        </div>
        
        <ReadOnlyField 
            label="Sub-District" 
            value={formData.subDistrict} 
            icon={<Building2 className="w-4 h-4" />} 
        />
        <ReadOnlyField 
            label="District" 
            value={formData.district} 
            icon={<Landmark className="w-4 h-4" />} 
        />
        <ReadOnlyField 
            label="State" 
            value={formData.state} 
            icon={<Map className="w-4 h-4" />} 
        />
        <ReadOnlyField 
            label="Country" 
            value={formData.country} 
            icon={<Globe2 className="w-4 h-4" />} 
        />
      </div>

      <button
        type="submit"
        className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-xl shadow-brand-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
      >
        Submit Registration <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </form>
  );
};

const ReadOnlyField = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
    <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        <span className="text-brand-600 opacity-70">{icon}</span>
        {value || <span className="text-gray-300 italic">Auto-filled...</span>}
    </div>
  </div>
);

export default AddressForm;
