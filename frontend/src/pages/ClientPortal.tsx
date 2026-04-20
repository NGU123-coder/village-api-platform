import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Key, Copy, Plus, Trash2, X, AlertTriangle, CheckCircle, LayoutDashboard, Key as KeyIcon, Wallet, Sparkles, Database, Eye, EyeOff } from 'lucide-react';
import AutocompleteInput from '../components/AutocompleteInput';

const ClientPortal = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{ id: string; secret: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testApiKey, setTestApiKey] = useState(() => localStorage.getItem('test_api_key') || '');
  const [showKey, setShowKey] = useState(false);

  // Sync test key to localStorage for persistence
  React.useEffect(() => {
    localStorage.setItem('test_api_key', testApiKey);
  }, [testApiKey]);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await api.get('/client/api-keys');
      return response.data.data;
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/client/api-keys', { name });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewKeyName('');
      const fullKey = `${data.id}.${data.secret}`;
      setGeneratedKey({ id: data.id, secret: data.secret });
      
      // Automatically store as the active key for the platform
      localStorage.setItem('apiKey', fullKey);
      
      setShowModal(true);
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/client/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-blue-600">Client Portal</h1>
            <div className="flex gap-4">
                <Link to="/client" className="text-sm font-bold text-blue-600 flex items-center gap-2">
                    <KeyIcon className="w-4 h-4" /> API Keys
                </Link>
                <Link to="/client/analytics" className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Analytics
                </Link>
                <Link to="/client/billing" className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Billing
                </Link>
            </div>
        </div>
        <div className="flex items-center gap-4 text-gray-600">
          <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{user?.planType} Plan</span>
          <button onClick={logout} className="text-sm font-medium hover:text-red-600">Logout</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-12 px-8">
        <header className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Your API Keys</h2>
          <p className="text-gray-600">Manage your credentials to access the All India Village API.</p>
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-12">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" /> Generate New Key
          </h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="e.g. Production Mobile App"
              className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <button
              onClick={() => createKeyMutation.mutate(newKeyName)}
              disabled={createKeyMutation.isPending || !newKeyName}
              className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-300 transition shadow-lg shadow-blue-100"
            >
              {createKeyMutation.isPending ? 'Generating...' : 'Generate Key'}
            </button>
          </div>
        </section>

        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-xs text-gray-400 uppercase tracking-widest">NAME</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-400 uppercase tracking-widest">CREATED</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-400 uppercase tracking-widest text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading your keys...</td></tr>
                ) : apiKeys?.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No API keys found. Generate one above to get started.</td></tr>
                ) : (
                  apiKeys?.map((key: any) => (
                    <tr key={key.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">{key.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{key.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(key.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if(window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
                              deleteKeyMutation.mutate(key.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-600 p-2 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* API Playground */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-10 mb-12 text-white shadow-2xl relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none">
                <Database size={200} />
            </div>
            
            <div className="max-w-2xl relative z-10">
                <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                    <Sparkles className="text-blue-400 w-6 h-6" /> API Playground
                </h3>
                <p className="text-slate-400 text-sm mb-8 font-medium italic">Test your integration live. Paste an API key below to search 600k+ villages.</p>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Paste your API Key (id.secret)</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type={showKey ? "text" : "password"}
                                    placeholder="e.g. 550e8400.secret..."
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-5 pr-12 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-slate-600 text-blue-100 font-mono"
                                    value={testApiKey}
                                    onChange={(e) => setTestApiKey(e.target.value)}
                                />
                                <button 
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <button 
                                onClick={() => copyToClipboard(testApiKey, 'test')}
                                className="bg-slate-700 p-3 rounded-xl hover:bg-slate-600 transition border border-slate-600 relative"
                                title="Copy Key"
                            >
                                {copiedField === 'test' ? <CheckCircle size={20} className="text-emerald-400" /> : <Copy size={20} className="text-slate-300" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 text-slate-900">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 text-slate-400">Search Villages</label>
                        <AutocompleteInput 
                            apiKey={testApiKey} 
                            onSelect={(v) => console.log('Selected from Playground:', v)}
                        />
                    </div>
                </div>
            </div>
        </section>
      </main>

      {/* API Key Modal */}
      {showModal && generatedKey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Key className="w-6 h-6" /> API Key Created
              </h3>
              <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition transform">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-8">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium">
                  Copy this key now! For security reasons, <span className="underline font-bold">you won’t be able to see this again</span>.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">FULL API KEY (ID.SECRET)</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-blue-50 border border-blue-100 rounded-xl font-mono text-sm text-blue-700 overflow-hidden text-ellipsis select-all">
                      {`${generatedKey.id}.${generatedKey.secret}`}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(`${generatedKey.id}.${generatedKey.secret}`, 'full')}
                      className="p-3 bg-blue-600 text-white border border-blue-600 rounded-xl hover:bg-blue-700 transition relative"
                    >
                      {copiedField === 'full' ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">KEY ID</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-500 overflow-hidden text-ellipsis">
                      {generatedKey.id}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">SECRET</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-500 overflow-hidden text-ellipsis">
                      {generatedKey.secret}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
              >
                I've copied the secret
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
