import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin, AlertCircle, X, ChevronDown, Clock, History } from 'lucide-react';
import api from '../services/api';

interface Props {
  apiKey: string;
  onSelect?: (village: any) => void;
}

const AutocompleteInput: React.FC<Props> = ({ apiKey, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_villages');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced API Search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/v1/autocomplete', {
          params: { q: query },
          headers: { 'x-api-key': apiKey }
        });
        setResults(response.data);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err: any) {
        setError(err.response?.status === 401 ? 'Invalid API Key' : 'Network Error');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, apiKey]);

  const saveToRecent = (village: any) => {
    const updated = [village, ...recentSearches.filter(v => (v.id || v.value) !== (village.id || village.value))].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_villages', JSON.stringify(updated));
  };

  const handleSelect = (village: any) => {
    setQuery(village.name || village.hierarchy?.village || '');
    setIsOpen(false);
    saveToRecent(village);
    if (onSelect) onSelect(village);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    const items = query.length < 2 ? recentSearches : results;
    if (items.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      handleSelect(items[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const HighlightMatch = ({ text, term }: { text: string; term: string }) => {
    if (!term.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return (
      <span>
        {parts.map((p, i) => 
          p.toLowerCase() === term.toLowerCase() ? <span key={i} className="text-blue-600 font-black">{p}</span> : p
        )}
      </span>
    );
  };

  return (
    <div className="relative w-full z-[50]" ref={containerRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          {loading ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : (
            <Search className={`w-4 h-4 transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400'}`} />
          )}
        </div>
        
        <input
          type="text"
          onKeyDown={handleKeyDown}
          className={`block w-full pl-11 pr-10 py-3.5 bg-white border rounded-2xl text-sm transition-all shadow-sm outline-none text-slate-900 ${
            error ? 'border-red-200 ring-4 ring-red-50' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
          }`}
          placeholder="Start typing a village name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
          {query && <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>}
          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1 px-1"><AlertCircle className="w-3 h-3" /> {error}</p>}

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Recent Searches Header */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="bg-slate-50/50 px-5 py-2 border-b border-slate-50 flex items-center gap-2">
                <History className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Searches</span>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200">
            <ul className="divide-y divide-slate-50">
              {(query.length < 2 ? recentSearches : results).map((v, i) => (
                <li 
                  key={v.id || v.value || i}
                  className={`px-5 py-4 cursor-pointer flex items-start gap-4 transition-all ${
                    i === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-600 pl-4' : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => handleSelect(v)}
                >
                  <div className={`mt-1 p-1.5 rounded-lg ${i === selectedIndex ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                      <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      <HighlightMatch text={v.name || v.hierarchy?.village || ''} term={query} />
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                      {v.subDistrictName || v.hierarchy?.subDistrict}, {v.districtName || v.hierarchy?.district}
                    </div>
                  </div>
                </li>
              ))}

              {!loading && query.length >= 2 && results.length === 0 && (
                  <div className="p-10 text-center flex flex-col items-center">
                      <Search className="w-8 h-8 text-slate-200 mb-2" />
                      <p className="text-sm text-slate-500 font-medium">No results found for "{query}"</p>
                  </div>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
