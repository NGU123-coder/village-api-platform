import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Activity, CheckCircle2, AlertCircle, Clock, 
  ChevronDown, Filter, LayoutDashboard, Key as KeyIcon, Wallet, Map
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const [days, setDays] = useState(7);
  const [selectedKey, setSelectedKey] = useState<string>('all');
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  // Fetch API Keys for filter
  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await api.get('/client/api-keys');
      return response.data;
    },
  });

  // Fetch Summary
  const { data: summary, isLoading: loadingSummary, error: summaryError } = useQuery({
    queryKey: ['analytics-summary', days, selectedKey],
    queryFn: async () => {
      console.log('📡 Fetching summary with token:', localStorage.getItem('token')?.substring(0, 10) + '...');
      const response = await api.get('/v1/analytics/summary', {
        params: { days, apiKeyId: selectedKey === 'all' ? undefined : selectedKey }
      });
      return response.data;
    },
  });

  if (summaryError) {
    console.error('❌ Analytics Fetch Error:', summaryError);
  }

  // Fetch Trends
  const { data: trends } = useQuery({
    queryKey: ['analytics-trends', days, selectedKey],
    queryFn: async () => {
      const response = await api.get('/v1/analytics/requests-over-time', {
        params: { days, apiKeyId: selectedKey === 'all' ? undefined : selectedKey }
      });
      return response.data;
    },
  });

  // Fetch Top Endpoints
  const { data: topEndpoints } = useQuery({
    queryKey: ['analytics-endpoints', selectedKey],
    queryFn: async () => {
      const response = await api.get('/v1/analytics/top-endpoints', {
        params: { apiKeyId: selectedKey === 'all' ? undefined : selectedKey }
      });
      return response.data;
    },
  });

  const pieData = [
    { name: 'Success', value: summary?.successRate || 0 },
    { name: 'Error', value: 100 - (summary?.successRate || 0) }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-blue-600">Client Portal</h1>
            <div className="flex gap-4">
                <Link to="/client" className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2">
                    <KeyIcon className="w-4 h-4" /> API Keys
                </Link>
                <Link to="/client/analytics" className="text-sm font-bold text-blue-600 flex items-center gap-2">
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

      <main className="max-w-7xl mx-auto py-10 px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Usage Analytics</h2>
            <p className="text-gray-500">Track your API consumption and performance metrics.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Time Range</label>
                <select 
                    value={days} 
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">API Key</label>
                <select 
                    value={selectedKey} 
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                >
                    <option value="all">All Keys</option>
                    {apiKeys?.map((key: any) => (
                        <option key={key.id} value={key.id}>{key.name}</option>
                    ))}
                </select>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Requests" 
            value={summary?.totalRequests?.toLocaleString()} 
            icon={<Activity className="text-blue-600" />} 
            color="bg-blue-50"
          />
          <StatCard 
            title="Success Rate" 
            value={`${summary?.successRate?.toFixed(1)}%`} 
            icon={<CheckCircle2 className="text-emerald-600" />} 
            color="bg-emerald-50"
          />
          <StatCard 
            title="Avg. Latency" 
            value={`${Math.round(summary?.avgLatency || 0)}ms`} 
            icon={<Clock className="text-amber-600" />} 
            color="bg-amber-50"
          />
          <StatCard 
            title="States Available" 
            value={summary?.totalStates || 0} 
            icon={<Map className="text-purple-600" />} 
            color="bg-purple-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Main Trend Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-8">Requests Over Time</h3>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12}}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12}}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="total" 
                                stroke="#3b82f6" 
                                strokeWidth={4} 
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Success Pie */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-8">Success vs Errors</h3>
                <div className="h-[250px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <span className="block text-2xl font-black text-gray-900">{summary?.successRate?.toFixed(0)}%</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Success</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Endpoints */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Top Endpoints</h3>
                <div className="space-y-4">
                    {topEndpoints?.map((endpoint: any, index: number) => (
                        <div key={endpoint.endpoint} className="flex items-center gap-4">
                            <span className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg text-xs font-bold text-gray-500">{index + 1}</span>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-mono text-gray-700">{endpoint.endpoint}</span>
                                    <span className="text-xs font-bold text-gray-900">{endpoint.count} reqs</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div 
                                        className="bg-blue-600 h-1.5 rounded-full" 
                                        style={{ width: `${(endpoint.count / (topEndpoints[0]?.count || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Plan Info */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg shadow-blue-200">
                <h3 className="text-xl font-bold mb-2">Usage Quota</h3>
                <p className="text-blue-100 mb-8 text-sm">Your {user?.planType} plan usage for today.</p>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Daily Requests</span>
                            <span className="text-sm font-bold">0 / 5,000</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3">
                            <div className="bg-white h-3 rounded-full" style={{ width: '2%' }}></div>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10">
                        <h4 className="text-sm font-bold mb-4">Tier Benefits:</h4>
                        <ul className="grid grid-cols-2 gap-3">
                            <BenefitItem text="5,000 req/day" />
                            <BenefitItem text="1 Active State" />
                            <BenefitItem text="Basic Support" />
                            <BenefitItem text="HTTPS Enabled" />
                        </ul>
                    </div>
                </div>

                <Link to="/client/billing" className="block w-full mt-8 bg-white text-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-50 transition text-center">
                    Upgrade Plan
                </Link>
            </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}>
      {React.cloneElement(icon, { className: `w-7 h-7 ${icon.props.className}` })}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-black text-gray-900">{value || '0'}</h4>
    </div>
  </div>
);

const BenefitItem = ({ text }: { text: string }) => (
    <li className="flex items-center gap-2 text-xs font-medium text-blue-50">
        <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" /> {text}
    </li>
);

export default Analytics;
