import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Globe, Zap, Shield, Database, LayoutDashboard } from 'lucide-react';

const LandingPage = () => {
  const [selectedState, setSelectedState] = useState('');
  
  const mockData: Record<string, string[]> = {
    'Maharashtra': ['Pune', 'Mumbai City', 'Thane', 'Nashik'],
    'Karnataka': ['Bangalore Urban', 'Mysuru', 'Hubballi', 'Mangaluru'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem']
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Database size={20}/></div>
            <div className="text-xl font-black text-gray-900 tracking-tighter">VILLAGE.API</div>
        </div>
        <div className="hidden md:flex gap-8 items-center font-medium">
          <a href="#features" className="hover:text-blue-600 transition text-sm">Features</a>
          <a href="#demo" className="hover:text-blue-600 transition text-sm">Live Demo</a>
          <Link to="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-sm flex items-center gap-2">
            <LayoutDashboard size={16} /> Client Portal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 md:px-12 py-20 md:py-32 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            NOW SERVING 600,000+ VILLAGES
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8 tracking-tight">
          The Definitive API for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">India's Rural Data.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Access high-performance hierarchical geographical data—from States down to the smallest Village. Built for logistics, e-commerce, and governance at scale.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/login" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition transform hover:-translate-y-1">
            Get Started Free <ChevronRight size={20} />
          </Link>
          <a href="#demo" className="bg-white text-gray-900 border border-gray-200 px-10 py-4 rounded-2xl font-bold hover:bg-gray-50 transition shadow-sm">
            View Live Demo
          </a>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="px-6 md:px-12 py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
                { label: 'Uptime', val: '99.99%' },
                { label: 'States Covered', val: '28' },
                { label: 'Villages Indexed', val: '640K+' },
                { label: 'Avg Latency', val: '<50ms' }
            ].map((stat, i) => (
                <div key={i} className="text-center">
                    <div className="text-2xl font-black text-gray-900">{stat.val}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
                </div>
            ))}
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-24 px-6 md:px-12 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Query with <br/>Precision.</h2>
            <p className="text-gray-500 mb-10 text-lg leading-relaxed">
              Our API maintains the strict administrative hierarchy of India. Try selecting a state to see how the data cascades down to the smallest administrative unit.
            </p>
            <div className="space-y-6">
                {[
                    { icon: <Zap className="text-amber-500" />, title: 'Edge Caching', desc: 'Global Redis (Upstash) integration for instant responses.' },
                    { icon: <Shield className="text-blue-500" />, title: 'Enterprise Security', desc: 'Secure API Key rotation and usage analytics for every client.' },
                ].map((item, i) => (
                    <div key={i} className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                        <div className="bg-gray-50 p-3 rounded-xl">{item.icon}</div>
                        <div>
                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          <div className="bg-slate-900 p-1 rounded-3xl shadow-3xl transform rotate-1 md:rotate-2">
            <div className="bg-white p-8 rounded-[1.4rem] shadow-inner">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                    <Globe className="text-blue-600" /> Interactive Explorer
                    </h3>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select State</label>
                        <select 
                            className="w-full mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer"
                            onChange={(e) => setSelectedState(e.target.value)}
                        >
                        <option value="">Choose a state...</option>
                        {Object.keys(mockData).map(state => <option key={state} value={state}>{state}</option>)}
                        </select>
                    </div>

                    <div className={`${!selectedState ? 'opacity-40' : 'opacity-100'} transition-opacity`}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select District</label>
                        <select className="w-full mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none cursor-pointer" disabled={!selectedState}>
                        <option>Choose a district...</option>
                        {selectedState && mockData[selectedState]?.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="pt-6 mt-8 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">JSON RESPONSE</span>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">200 OK</span>
                        </div>
                        <div className="bg-slate-900 text-indigo-200 p-6 rounded-2xl font-mono text-xs overflow-x-auto shadow-xl leading-relaxed">
                            {`{
  "status": "success",
  "data": {
    "state": "${selectedState || '...'}",
    "districts": ${JSON.stringify(mockData[selectedState] || [], null, 2)}
  },
  "latency": "24ms"
}`}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 md:px-12 bg-slate-950 text-white mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Database size={20}/></div>
                <div className="text-xl font-black tracking-tighter">VILLAGE.API</div>
            </div>
            <div className="text-slate-400 text-sm max-w-md text-center">
                Production-grade SaaS platform for Indian geographical data. Built as a Capstone project with Node.js, Prisma, and PostgreSQL.
            </div>
            <div className="text-slate-500 text-xs">
                © 2026 All India Village API Platform. All rights reserved.
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
