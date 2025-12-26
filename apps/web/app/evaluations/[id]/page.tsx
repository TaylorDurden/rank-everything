'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { 
  ChevronLeft, 
  Sparkles, 
  Target, 
  FileText, 
  Activity,
  History,
  ArrowUpRight,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  Zap,
  BarChart3,
  Loader2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function EvaluationDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: evaluation, isLoading, error } = useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => apiFetch<any>(`/evaluations/${id}`),
    enabled: !!id,
  });

  const runAnalysis = useMutation({
    mutationFn: () => apiFetch('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({
        assetId: evaluation?.assetId,
        templateId: evaluation?.templateId,
        evaluationId: id
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation', id] });
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      toast.success('AI Analysis synchronized successfully.');
    },
    onError: (err: any) => {
      toast.error(`Analysis failure: ${err.message}`);
    }
  });

  const { data: report } = useQuery({
    queryKey: ['report', id],
    queryFn: () => apiFetch<any>(`/reports/${id}`),
    enabled: !!id && evaluation?.status === 'completed',
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="font-bold tracking-widest uppercase text-xs animate-pulse">Decrypting Evaluation Matrix...</p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[2.5rem] text-center">
          <h2 className="text-2xl font-bold text-red-400">Sync Failure</h2>
          <p className="text-red-400/60 mt-2">Could not retrieve the evaluation signature from the decentralized registry.</p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ evaluation, report }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `evaluation_${id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadPdf = useMutation({
    mutationFn: async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : '';

      const response = await fetch(`${API_URL}/reports/${id}/pdf`, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to generate PDF' }));
        throw new Error(error.message || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${evaluation?.asset?.name || id}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    },
    onSuccess: () => {
      toast.success('PDF report downloaded successfully');
    },
    onError: (err: any) => {
      toast.error(`Failed to download PDF: ${err.message}`);
    },
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button onClick={() => router.push('/evaluations')} className="flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors text-xs font-black uppercase tracking-widest mb-4">
            <ChevronLeft className="h-4 w-4" /> Global Intelligence
          </button>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            {evaluation.asset?.name}
            <div className={clsx(
              "px-3 py-1 rounded-full text-[10px] uppercase tracking-widest",
              evaluation.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            )}>
              {evaluation.status}
            </div>
          </h1>
          <p className="text-slate-400 text-lg">
            Evaluation synchronized using the <span className="text-blue-400 font-bold">{evaluation.template?.name}</span> framework.
          </p>
        </div>
        <div className="flex gap-4">
          {evaluation.status === 'completed' && (
            <button 
              onClick={() => downloadPdf.mutate()}
              disabled={downloadPdf.isPending}
              className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 font-bold hover:text-blue-300 hover:bg-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadPdf.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download PDF
                </>
              )}
            </button>
          )}
          <button 
            onClick={handleExport}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-bold hover:text-white transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-5 h-5" />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Core Stats */}
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><Activity className="w-12 h-12" /></div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Execution Index</p>
              <h3 className="text-3xl font-black text-white">{evaluation.progress}%</h3>
              <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${evaluation.progress}%` }} />
              </div>
            </div>
            
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><ShieldCheck className="w-12 h-12" /></div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Framework Score</p>
              <h3 className="text-3xl font-black text-white">{report?.summary.overallScore || 'N/A'}</h3>
              <p className="text-[10px] text-slate-500 mt-2">Aggregate based on {evaluation.template?.dimensions.length} dimensions</p>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><BrainCircuit className="w-12 h-12" /></div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">AI Recommendation</p>
              <h3 className="text-xl font-bold text-emerald-400">OPTIMIZE</h3>
              <p className="text-[10px] text-slate-500 mt-2">High confidence synchronization</p>
            </div>
          </div>

          <div className="p-8 backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Dimension Breakdown
              </h3>
            </div>

            <div className="space-y-6">
              {evaluation.template?.dimensions.map((dim: any, i: number) => {
                const score = report?.results?.scores?.[dim.name.toLowerCase()] || 
                             report?.results?.scores?.[dim.key] || 
                             (evaluation.status === 'completed' ? 85 : 0);
                
                return (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-sm font-bold text-white">{dim.name}</span>
                        <span className="ml-2 text-[10px] text-slate-500 uppercase tracking-widest">Weight: {dim.weight}%</span>
                      </div>
                      <span className="text-sm font-mono text-blue-400">{score} / 100</span>
                    </div>
                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                        style={{ width: `${score}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              Asset Metadata
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Category</span>
                <span className="text-xs text-white font-mono">{evaluation.asset?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Status</span>
                <span className="text-xs text-emerald-400 font-mono">Sync Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">ID Registry</span>
                <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]">{evaluation.asset?.id}</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-gradient-to-br from-blue-600/20 to-purple-700/20 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
            <Zap className="absolute -right-6 -bottom-6 w-24 h-24 text-white/5 group-hover:scale-150 transition-transform" />
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              AI Summary Report
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed italic">
              "Based on the input dimensions, this asset shows exceptional performance in {evaluation.template?.dimensions?.[0]?.name || 'Core Operations'}. We recommend resource reallocation to optimize the {evaluation.template?.dimensions?.[1]?.name || 'Secondary'} layer."
            </p>
            <button 
              onClick={() => runAnalysis.mutate()}
              disabled={runAnalysis.isPending || evaluation.status === 'completed'}
              className="mt-6 text-sm font-bold text-blue-400 flex items-center gap-1 hover:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runAnalysis.isPending ? 'Synchronizing Intelligence...' : evaluation.status === 'completed' ? 'Analysis synchronized' : 'Request Full Analysis'} 
              {!runAnalysis.isPending && evaluation.status !== 'completed' && <ArrowUpRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
