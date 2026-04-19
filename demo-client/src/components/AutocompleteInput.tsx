import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { searchVillages } from '../api/apiService';

interface VillageData {
  id: string;
  name: string;
  subDistrict: {
    name: string;
    district: {
      name: string;
      state: {
        name: string;
      }
    }
  }
}

interface Props {
  onSelect: (village: VillageData) => void;
}

const AutocompleteInput = ({ onSelect }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VillageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        const data = await searchVillages(query);
        setResults(data);
        setLoading(false);
        setShowDropdown(true);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (village: VillageData) => {
    setQuery(village.name);
    setShowDropdown(false);
    onSelect(village);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Village / Area Search</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-600 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 outline-none transition-all placeholder:text-gray-400"
          placeholder="Start typing your village name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
        />
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 max-h-72 overflow-y-auto divide-y divide-gray-50 overflow-hidden">
          {results.map((village) => (
            <li 
              key={village.id}
              className="px-4 py-3.5 hover:bg-brand-50 cursor-pointer transition-colors group flex items-start gap-3"
              onClick={() => handleSelect(village)}
            >
              <div className="mt-1 w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="block text-sm font-bold text-gray-900 group-hover:text-brand-700">{village.name}</span>
                <span className="block text-[11px] text-gray-500 font-medium">
                  {village.subDistrict.name}, {village.subDistrict.district.name}, {village.subDistrict.district.state.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 p-6 rounded-2xl shadow-xl text-center">
            <p className="text-sm text-gray-500 font-medium italic">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
