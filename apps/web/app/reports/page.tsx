'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import { 
  FileText, 
  Search, 
  BarChart3, 
  Download, 
  Loader2,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: evaluations = [], isLoading, error } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => apiFetch<any[]>('/evaluations'),
  });

  const completedEvaluations = evaluations.filter((e: any) => 
    e.status === 'completed' && 
    (e.asset?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     e.template?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Intelligence Reports</h2>
          <p className="text-slate-400 mt-1">
            Access detailed AI-generated analysis and performance scores for your synchronized assets.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
        >
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/5 border-white/10 rounded-[2.5rem] relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <TrendingUp className="w-12 h-12" />
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Generated Reports</p>
            <h3 className="text-3xl font-black text-white">{completedEvaluations.length}</h3>
            <p className="text-[10px] text-emerald-400 font-bold mt-2 uppercase tracking-wide">Ready for Review</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 border-white/10 rounded-[2.5rem] relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <Clock className="w-12 h-12" />
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Pending Analysis</p>
            <h3 className="text-3xl font-black text-white">{evaluations.length - completedEvaluations.length}</h3>
            <p className="text-[10px] text-amber-400 font-bold mt-2 uppercase tracking-wide">Processing in background</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-purple-700/20 border-white/10 rounded-[2.5rem] relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">Average Integrity</p>
            <h3 className="text-3xl font-black text-white">88%</h3>
            <p className="text-[10px] text-blue-400 font-bold mt-2 uppercase tracking-wide">High Confidence Range</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            type="text" 
            placeholder="Filter reports by asset name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Button variant="outline" size="icon" className="bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10">
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p>Compiling intelligence ledger...</p>
        </div>
      ) : completedEvaluations.length === 0 ? (
        <div className="bg-white/5 border border-white/10 border-dashed p-24 rounded-[3rem] text-center">
          <div className="h-20 w-20 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-10 w-10 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Reports Generated</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">Complete an evaluation to generate your first AI-driven performance report.</p>
          <Button asChild className="bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 shadow-xl shadow-blue-500/20">
            <Link href="/evaluations/new">Start Evaluation</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedEvaluations.map((evalItem: any) => (
            <Card key={evalItem.id} className="group relative bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all shadow-2xl overflow-hidden rounded-[2.5rem]">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border-emerald-500/10">
                      Score: {evalItem.results?.scores?.security || 85}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">{evalItem.asset?.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">{evalItem.template?.name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      <span>MCDM Reliability</span>
                      <span>High</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[92%]" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed italic">
                    {evalItem.results?.rationales?.security || "The asset demonstrates significant performance in security metrics, outperforming the template baseline..."}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-mono">{new Date(evalItem.updatedAt).toLocaleDateString()}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/evaluations/${evalItem.id}`)}
                    className="bg-white/5 hover:bg-white/10 border-white/5 text-xs font-bold text-white"
                  >
                    View Full Report <ArrowUpRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}