import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { 
  CreditCard, Check, ShieldCheck, Zap, 
  Crown, Infinity, Clock, ArrowRight, Loader2,
  Key as KeyIcon, LayoutDashboard, Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    features: ['5,000 req/day', '1 State Access', 'Standard Support', 'Shared Infrastructure'],
    icon: <Zap className="w-6 h-6" />,
    color: 'blue'
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 49,
    features: ['50,000 req/day', '5 States Access', 'Email Support', 'Priority Infrastructure'],
    icon: <Crown className="w-6 h-6" />,
    color: 'emerald',
    popular: true
  },
  {
    id: 'PRO',
    name: 'Professional',
    price: 199,
    features: ['300,000 req/day', 'All States Access', '24/7 Support', 'Dedicated Throughput'],
    icon: <ShieldCheck className="w-6 h-6" />,
    color: 'purple'
  },
  {
    id: 'UNLIMITED',
    name: 'Unlimited',
    price: 499,
    features: ['1,000,000 req/day', 'All States Access', 'Direct Engineer Slack', 'Unlimited Burst'],
    icon: <Infinity className="w-6 h-6" />,
    color: 'slate'
  }
];

const Billing = () => {
  const { user, setUser, logout } = useAuthStore();
  const [showPaymentModal, setShowPaymentModal] = useState<any>(null);
  const queryClient = useQueryClient();

  const checkoutMutation = useMutation({
    mutationFn: async (planType: string) => {
      const response = await api.post('/v1/billing/checkout', { planType });
      return response.data.data;
    },
    onSuccess: (data) => {
        // Update local user state with new plan
        if (user) {
            setUser({ ...user, planType: data.user.planType });
        }
        setShowPaymentModal(null);
        alert('Payment successful! Your plan has been upgraded.');
        queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
        const response = await api.get('/v1/billing/history');
        return response.data.data;
    }
  });

  const downloadInvoice = (payment: any) => {
    const invoiceContent = `
=========================================
          VILLAGE API PLATFORM
              INVOICE
=========================================
Invoice ID: ${payment.id}
Date: ${new Date(payment.createdAt).toLocaleString()}
Customer: ${user?.email}
-----------------------------------------
Plan: ${payment.plan}
Amount: $${payment.amount}.00
Status: ${payment.status}
-----------------------------------------
Thank you for your business!
=========================================
    `;
    
    const element = document.createElement("a");
    const file = new Blob([invoiceContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `invoice_${payment.id.substring(0, 8)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-blue-600">Client Portal</h1>
            <div className="flex gap-4">
                <Link to="/client" className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2">
                    <KeyIcon className="w-4 h-4" /> API Keys
                </Link>
                <Link to="/client/analytics" className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Analytics
                </Link>
                <Link to="/client/billing" className="text-sm font-bold text-blue-600 flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Billing
                </Link>
            </div>
        </div>
        <div className="flex items-center gap-4 text-gray-600">
          <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{user?.planType} Plan</span>
          <button onClick={logout} className="text-sm font-medium hover:text-red-600">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-8">
        <header className="mb-12 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Plans & Pricing</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Scale your village data access as your business grows. All paid plans include a 30-day billing cycle.</p>
        </header>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {PLANS.map((plan) => (
            <div 
                key={plan.id}
                className={`relative bg-white rounded-[2rem] p-8 border-2 transition-all ${
                    user?.planType === plan.id 
                    ? 'border-blue-600 shadow-xl shadow-blue-50 ring-4 ring-blue-50' 
                    : 'border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Most Popular
                </div>
              )}

              <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center bg-${plan.color}-50 text-${plan.color}-600`}>
                {plan.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-gray-900">${plan.price}</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {feature}
                    </li>
                ))}
              </ul>

              <button
                onClick={() => user?.planType !== plan.id && setShowPaymentModal(plan)}
                disabled={user?.planType === plan.id}
                className={`w-full py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 ${
                    user?.planType === plan.id
                    ? 'bg-blue-50 text-blue-600 cursor-default'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                }`}
              >
                {user?.planType === plan.id ? 'Current Plan' : `Upgrade to ${plan.name}`}
                {user?.planType !== plan.id && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>

        {/* Payment History */}
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold">Billing History</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" /> Subscriptions reset every 30 days
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Invoice</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payments?.map((payment: any) => (
                            <tr key={payment.id} className="hover:bg-gray-50 transition">
                                <td className="px-8 py-5 text-sm text-gray-600">{new Date(payment.createdAt).toLocaleDateString()}</td>
                                <td className="px-8 py-5 font-bold text-gray-900">{payment.plan}</td>
                                <td className="px-8 py-5 text-sm font-medium text-gray-700">${payment.amount}</td>
                                <td className="px-8 py-5">
                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md ${
                                        payment.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {payment.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button 
                                        onClick={() => downloadInvoice(payment)}
                                        className="text-blue-600 text-sm font-bold hover:underline"
                                    >
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
      </main>

      {/* Payment Simulation Modal */}
      {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up">
                  <div className="p-10 text-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                        <CreditCard className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Simulated Checkout</h3>
                    <p className="text-gray-500 mb-8">You are upgrading to the <span className="font-bold text-gray-900">{showPaymentModal.name}</span> plan for <span className="font-bold text-gray-900">${showPaymentModal.price}/month</span>.</p>
                    
                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100">
                        <div className="flex justify-between mb-4">
                            <span className="text-sm text-gray-500">Plan Amount</span>
                            <span className="text-sm font-bold text-gray-900">${showPaymentModal.price}.00</span>
                        </div>
                        <div className="flex justify-between pt-4 border-t border-gray-200">
                            <span className="text-sm font-bold text-gray-900">Total Charged</span>
                            <span className="text-lg font-black text-blue-600">${showPaymentModal.price}.00</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowPaymentModal(null)}
                            disabled={checkoutMutation.isPending}
                            className="flex-1 py-4 text-sm font-bold text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => checkoutMutation.mutate(showPaymentModal.id)}
                            disabled={checkoutMutation.isPending}
                            className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:bg-blue-300 flex items-center justify-center gap-2"
                        >
                            {checkoutMutation.isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                </>
                            ) : (
                                `Pay $${showPaymentModal.price}.00`
                            )}
                        </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 py-4 px-10 text-center border-t border-gray-100">
                      <p className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> SECURE STRIPE-LIKE SIMULATED ENVIRONMENT
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Billing;
