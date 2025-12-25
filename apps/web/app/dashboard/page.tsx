'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  ClipboardList, 
  FileText, 
  TrendingUp,
  ArrowUpRight,
  Plus,
  Sparkles,
  Zap,
  Activity,
  History,
  MoreVertical
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => apiFetch<any[]>('/assets'),
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => apiFetch<any[]>('/evaluations'),
  });

  const completedEvaluations = evaluations.filter(e => e.status === 'completed');

  const stats = [
    { name: 'Managed Assets', value: assets.length.toString(), icon: BarChart3, change: assets.length > 0 ? `+${assets.length}` : '+0', changeType: assets.length > 0 ? 'positive' : 'neutral' },
    { name: 'Active Evaluations', value: evaluations.length.toString(), icon: ClipboardList, change: evaluations.length > 0 ? `+${evaluations.length}` : '+0', changeType: evaluations.length > 0 ? 'positive' : 'neutral' },
    { name: 'AI Reports', value: completedEvaluations.length.toString(), icon: FileText, change: completedEvaluations.length > 0 ? `+${completedEvaluations.length}` : '+0', changeType: completedEvaluations.length > 0 ? 'positive' : 'neutral' },
    { name: 'System Rating', value: '88%', icon: TrendingUp, change: '+1.2', changeType: 'positive' },
  ];

  const recentAssets = assets.slice(0, 4);

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Welcome back, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'User'}</span>
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Here's the latest overview of your asset evaluation performance.
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild variant="outline" className="group relative px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-medium hover:text-white transition-all overflow-hidden">
            <Link href="/evaluations">
              <span className="relative flex items-center gap-2">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <History className="w-4 h-4" />
                View Activity
              </span>
            </Link>
          </Button>
          <Button asChild className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-95 flex items-center gap-2">
            <Link href="/evaluations/new">
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Evaluation
              </span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="group relative p-6 bg-white/5 border border-white/10 rounded-3xl transition-all hover:bg-white/[0.08] hover:border-white/20 overflow-hidden shadow-2xl">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent blur-2xl group-hover:from-blue-500/20 transition-all" />
            
            <CardHeader className="flex flex-row items-center justify-between p-0 mb-4">
              <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                <stat.icon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex flex-col items-end">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                  stat.changeType === 'positive' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {stat.change}
                  <ArrowUpRight className="h-3 w-3" />
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">vs last week</span>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <CardTitle className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stat.value}</CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-widest">{stat.name}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Assets List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Assets
            </h3>
            <Link href="/assets" className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              Explore All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl divide-y divide-white/5">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center text-slate-500 animate-pulse">Loading latest synchronization...</div>
              ) : recentAssets.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <p className="text-slate-500 italic">No assets registered yet.</p>
                  <Link href="/assets" className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:bg-white/10">Start Tracking Assets</Link>
                </div>
              ) : (
                recentAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <BarChart3 className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">{asset.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono uppercase text-slate-500 tracking-wider">Type: {asset.type}</span>
                          <span className="text-slate-700">•</span>
                          <span className="text-xs text-slate-500">Synced {new Date(asset.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Synchronized
                      </span>
                      <button className="p-2 text-slate-600 hover:text-white transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Side Card */}
        <div className="space-y-6">
          <Card className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 transform group-hover:scale-125 transition-transform">
              <Zap className="w-24 h-24 text-white/10" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-white leading-tight">Initiate AI Evaluation</CardTitle>
                <CardDescription className="text-indigo-100 mt-2 font-medium opacity-80 leading-relaxed">
                  Start our advanced MCDM analysis powered by Gemini 2.0 to rank your strategic assets.
                </CardDescription>
              </div>
              <Button
                asChild
                className="block text-center w-full bg-white text-indigo-600 font-bold py-4 rounded-3xl shadow-lg hover:bg-slate-100 transition-all active:scale-95"
              >
                <Link href="/evaluations/new">
                  Launch Wizard
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Pro Feature
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-sm text-slate-400 leading-relaxed">
                Export your evaluation reports in interactive PDF formats or share directly with stakeholders via protected links.
              </CardDescription>
              <Button variant="link" className="mt-6 text-sm font-bold text-blue-400 flex items-center gap-1 hover:gap-2 transition-all p-0 h-auto">
                Learn more about Reports <ArrowUpRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
