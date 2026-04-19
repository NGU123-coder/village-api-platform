import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6">
        <h1 className="text-xl font-bold mb-8">Village API Admin</h1>
        <nav>
          <ul>
            <li className="mb-4 bg-slate-800 p-2 rounded">Dashboard</li>
            <li className="mb-4 hover:bg-slate-800 p-2 rounded cursor-pointer">Users</li>
            <li className="mb-4 hover:bg-slate-800 p-2 rounded cursor-pointer">API Logs</li>
            <li className="mb-4 hover:bg-slate-800 p-2 rounded cursor-pointer" onClick={logout}>Logout</li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">System Overview</h2>
          <div className="text-gray-600">Welcome, {user?.email}</div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Total Requests (24h)</h3>
            <p className="text-3xl font-bold mt-2">124,502</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Active API Keys</h3>
            <p className="text-3xl font-bold mt-2">1,240</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Avg. Latency</h3>
            <p className="text-3xl font-bold mt-2">45ms</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96">
          <h3 className="text-lg font-semibold mb-4">Traffic per Hour</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dummyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="requests" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const dummyData = [
  { name: '00:00', requests: 4000 },
  { name: '04:00', requests: 3000 },
  { name: '08:00', requests: 2000 },
  { name: '12:00', requests: 2780 },
  { name: '16:00', requests: 1890 },
  { name: '20:00', requests: 2390 },
];

export default AdminDashboard;
