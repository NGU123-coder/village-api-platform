import React from 'react';
import AddressForm from './components/AddressForm';
import { Sparkles, ArrowRight, Database } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Banner */}
      <div className="bg-brand-600 py-3 text-center px-4">
        <p className="text-white text-xs font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" /> API Demo Application for All India Village Data
        </p>
      </div>

      <main className="max-w-4xl mx-auto py-20 px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <Database className="w-3.5 h-3.5" /> B2B Showcase
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-6">
            Experience Smart <span className="text-brand-600">Address Filling</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Reducing friction in rural registration by automatically fetching hierarchical geo-data. Try searching for any village in India below.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100 relative">
          <AddressForm />
        </div>

        <footer className="mt-20 text-center border-t border-slate-100 pt-10">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Powered by</p>
          <div className="flex items-center justify-center gap-2 text-slate-900 font-black text-xl">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-xs">V</div>
             Village API Platform
          </div>
          <a href="#" className="inline-flex items-center gap-2 mt-8 text-brand-600 font-bold hover:underline">
             Get Your API Key <ArrowRight className="w-4 h-4" />
          </a>
        </footer>
      </main>
    </div>
  );
}

export default App;
