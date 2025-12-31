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
  Download,
  Minus,
  TrendingDown,
  Lightbulb,
  Layers,
  ArrowRight,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

function parseReport(markdown: string) {
  if (!markdown) return { findings: [], risks: [] };
  
  const sections = markdown.split('## ');
  const findingsSection = sections.find(s => s.startsWith('关键发现') || s.startsWith('Key Findings'));
  const risksSection = sections.find(s => s.startsWith('潜在风险') || s.startsWith('Potential Risks'));
  
  const parseList = (section: string) => {
    if (!section) return [];
    return section.split('\n')
      .filter(line => line.trim().startsWith('- '))
      .map(line => line.trim().substring(2));
  };

  return {
    findings: parseList(findingsSection || ''),
    risks: parseList(risksSection || '')
  };
}

function parseSuggestion(text: string) {
  // Remove markdown numbering if present (e.g., "1. **Title**")
  let cleanText = text.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '');

  const titleEnd = cleanText.indexOf(':');
  if (titleEnd === -1) return { title: cleanText, content: '' };

  const title = cleanText.substring(0, titleEnd).trim();
  let rest = cleanText.substring(titleEnd + 1).trim();

  // Extract metadata (effort, impact, eta) which are usually at the end
  // Format might be: "... content. [medium] (预计: 1 week)" 
  // or "... content. (影响: high, 难度: medium)"

  let effort = undefined;
  let eta = undefined;

  // Try to find [effort]
  const effortMatch = rest.match(/\[(.*?)\]/);
  if (effortMatch && effortMatch[0] && effortMatch[1]) {
    effort = effortMatch[1];
    rest = rest.replace(effortMatch[0], '').trim();
  }

  // Try to find (预计: ...) or (Expect: ...)
  const etaMatch = rest.match(/\((?:预计|Expected|Time):\s*(.*?)\)/i);
  if (etaMatch && etaMatch[0] && etaMatch[1]) {
    eta = etaMatch[1];
    rest = rest.replace(etaMatch[0], '').trim();
  }

  // Also handle the format: (影响: ..., 难度: ...)
  const complexMatch = rest.match(/\((.*?)\)$/);
  if (complexMatch && complexMatch[0] && complexMatch[1] && !eta) {
      const parts = complexMatch[1].split(/,|，/);
      parts.forEach(p => {
          if (p.includes('难度') || p.includes('Difficulty') || p.includes('Effort')) {
              effort = p.split(/:|：/)[1]?.trim();
          }
      });
      
      // Let's just strip the whole parenthesis if it contains metadata
      if (complexMatch[1].includes('难度') || complexMatch[1].includes('Difficulty')) {
          rest = rest.replace(complexMatch[0], '').trim();
      }
  }

  return { title, content: rest, effort, eta };
}

export default function EvaluationDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: evaluation, isLoading, error } = useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => apiFetch<any>(`/evaluations/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
        const data = query.state.data;
        return (data?.status === 'processing' || data?.status === 'draft') ? 2000 : false;
    }
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
      toast.info('AI is analyzing... You can leave this page, the report will be ready shortly.');
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

  const { data: historyEvaluations } = useQuery({
    queryKey: ['evaluations', 'history', evaluation?.assetId],
    queryFn: () => apiFetch<any[]>(`/evaluations?assetId=${evaluation?.assetId}`),
    enabled: !!evaluation?.assetId,
  });

  // Calculate or extract Overall Score
  const overallScore = useMemo(() => {
    // 1. Direct score from report entity (Highest Priority)
    if (typeof report?.score === 'number') return report.score;

    if (!report?.results) return null;
    
    // 2. Try to extract from Markdown
    const markdown = report.results.reportMarkdown;
    if (markdown) {
        const match = markdown.match(/(?:总体评分|Overall Score).*?(\d+)(?:\/100)?/s);
        if (match) return parseInt(match[1], 10);
    }

    // 3. Fallback: Calculate weighted average
    const scores = report.results.scores || {};
    const dims = evaluation?.template?.dimensions || [];
    if (Object.keys(scores).length > 0 && dims.length > 0) {
        let totalScore = 0;
        let totalWeight = 0;
        
        dims.forEach((d: any) => {
            const s = scores[d.name] || scores[d.key];
            if (s !== undefined) {
                totalScore += s * (d.weight || 0);
                totalWeight += (d.weight || 0);
            }
        });

        if (totalWeight > 0) return Math.round(totalScore / totalWeight);

        const values = Object.values(scores) as number[];
        if (values.length > 0) {
            return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        }
    }
    
    return null;
  }, [report, evaluation]);

  // Merge dimensions for display
  const displayDimensions = useMemo(() => {
      const scores = report?.results?.scores || {};
      const rationales = report?.results?.rationales || {};
      const templateDims = evaluation?.template?.dimensions || [];
      
      const scoreKeys = Object.keys(scores);
      
      if (scoreKeys.length > 0) {
          return scoreKeys.map(key => {
              const tDim = templateDims.find((d: any) => d.name === key || d.key === key);
              return {
                  name: key,
                  weight: tDim?.weight, 
                  score: scores[key],
                  rationale: rationales[key]
              };
          });
      }
      
      return templateDims.map((d: any) => ({
          name: d.name,
          weight: d.weight,
          score: evaluation?.status === 'completed' ? 0 : 0,
          rationale: null
      }));
  }, [report, evaluation]);

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

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ evaluation, report }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `evaluation_${id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

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
  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4 max-w-3xl">
          <button onClick={() => router.push('/evaluations')} className="flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors text-xs font-black uppercase tracking-widest">
            <ChevronLeft className="h-4 w-4" /> Global Intelligence
          </button>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {evaluation.asset?.name}
                <div className={clsx(
                "px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border",
                evaluation.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                )}>
                {evaluation.status}
                </div>
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>Framework: <span className="text-blue-400 font-bold">{evaluation.template?.name}</span></span>
                {report?.createdAt && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span>Analyzed on {new Date(report.createdAt).toLocaleDateString()}</span>
                    </>
                )}
            </div>
          </div>

          {/* Asset Context / Description */}
          {evaluation.asset?.description && (
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Context
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-sm">
                      {evaluation.asset.description}
                  </p>
              </div>
          )}
        </div>
        
        {/* Actions Buttons */}
        <div className="flex gap-3">
          {evaluation.status === 'completed' && (
            <button 
              onClick={() => downloadPdf.mutate()}
              disabled={downloadPdf.isPending}
              className="px-5 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 font-bold hover:text-blue-300 hover:bg-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              {downloadPdf.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </button>
          )}
          <button 
            onClick={handleExport}
            className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-bold hover:text-white transition-all flex items-center gap-2 text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Export
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
              <h3 className="text-3xl font-black text-white">{overallScore || report?.summary?.overallScore || 'N/A'}</h3>
              <p className="text-[10px] text-slate-500 mt-2">Aggregate based on {displayDimensions.length} dimensions</p>
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
              {displayDimensions.map((dim: any, i: number) => {
                return (
                  <div key={i} className="space-y-3 group">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{dim.name}</span>
                        {dim.weight && <span className="ml-2 text-[10px] text-slate-500 uppercase tracking-widest">Weight: {dim.weight}%</span>}
                      </div>
                      <span className="text-sm font-mono text-blue-400">{dim.score} / 100</span>
                    </div>
                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                        style={{ width: `${dim.score}%` }} 
                      />
                    </div>
                    {dim.rationale && (
                      <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                        {dim.rationale}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Detailed Report Sections */}
          {report?.results?.reportMarkdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Key Findings */}
               <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    Key Findings
                  </h3>
                  <ul className="space-y-4">
                    {parseReport(report.results.reportMarkdown).findings.map((finding: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="text-emerald-500/50 font-mono mt-0.5">0{i + 1}</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
               </div>

               {/* Risks */}
               <div className="p-8 bg-white/5 border border-red-500/20 rounded-[2.5rem] space-y-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck className="w-32 h-32" /></div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-400" />
                    Risk Assessment
                  </h3>
                  <ul className="space-y-4 relative z-10">
                    {parseReport(report.results.reportMarkdown).risks.map((risk: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-300">
                         <div className="min-w-1.5 h-1.5 mt-2 rounded-full bg-red-500" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
          )}

          {/* Historical Comparison */}
          {report?.results?.comparison && (
             <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-cyan-400" />
                    Historical Comparison
                </h3>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-cyan-400 pl-4 py-1">
                        {report.results.comparison.summary}
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-bold text-emerald-400 text-sm uppercase tracking-wider">
                            <TrendingUp className="w-4 h-4" /> Improvements
                        </h4>
                        {report.results.comparison.improvements?.length > 0 ? (
                             <ul className="space-y-3">
                                {report.results.comparison.improvements.map((item: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-400 flex items-start gap-3">
                                         <div className="min-w-1.5 h-1.5 mt-2 rounded-full bg-emerald-500" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                             </ul>
                        ) : (
                            <p className="text-xs text-slate-600 italic">No significant improvements detected.</p>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-bold text-red-400 text-sm uppercase tracking-wider">
                            <TrendingDown className="w-4 h-4" /> Regressions / Attention Points
                        </h4>
                        {report.results.comparison.regressions?.length > 0 ? (
                             <ul className="space-y-3">
                                {report.results.comparison.regressions.map((item: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-400 flex items-start gap-3">
                                         <div className="min-w-1.5 h-1.5 mt-2 rounded-full bg-red-500" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                             </ul>
                        ) : (
                            <p className="text-xs text-slate-600 italic">No regressions detected.</p>
                        )}
                    </div>
                </div>
             </div>
          )}

          {/* New: Future Scenarios (Projections) */}
          {report?.results?.projections && report.results.projections.length > 0 && (
             <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Future Scenarios Projection
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {report.results.projections.map((proj: any, i: number) => {
                        const isOptimistic = proj.scenario?.toLowerCase().includes('optimistic') || proj.scenario?.includes('乐观');
                        const isPessimistic = proj.scenario?.toLowerCase().includes('pessimistic') || proj.scenario?.includes('risk') || proj.scenario?.includes('风险') || proj.scenario?.includes('保守');
                        const isBaseline = !isOptimistic && !isPessimistic;

                        return (
                            <div key={i} className={clsx(
                                "p-6 rounded-3xl border flex flex-col gap-4 relative overflow-hidden group transition-all hover:-translate-y-1",
                                isOptimistic ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10" :
                                isPessimistic ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" :
                                "bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10"
                            )}>
                                <div className="flex justify-between items-center">
                                    <div className={clsx(
                                        "p-2 rounded-xl",
                                        isOptimistic ? "bg-emerald-500/20 text-emerald-400" :
                                        isPessimistic ? "bg-red-500/20 text-red-400" :
                                        "bg-blue-500/20 text-blue-400"
                                    )}>
                                        {isOptimistic ? <TrendingUp className="w-5 h-5" /> : 
                                         isPessimistic ? <TrendingDown className="w-5 h-5" /> : 
                                         <Activity className="w-5 h-5" />}
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                        Prob: {proj.probability}
                                    </span>
                                </div>
                                <div>
                                    <h4 className={clsx("font-bold text-lg mb-1", 
                                        isOptimistic ? "text-emerald-400" : 
                                        isPessimistic ? "text-red-400" : 
                                        "text-blue-400"
                                    )}>{proj.scenario}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">{proj.description}</p>
                                </div>
                                <div className="mt-auto pt-4 border-t border-white/5">
                                    <p className="text-sm font-medium text-white">{proj.outcome}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
             </div>
          )}

          {/* New: Specific Recommendations (Categorized) */}
          {report?.results?.specificRecommendations && report.results.specificRecommendations.length > 0 && (
            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Targeted Advice
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {report.results.specificRecommendations.map((cat: any, i: number) => (
                        <div key={i} className="space-y-4">
                            <h4 className="flex items-center gap-2 font-bold text-slate-300 border-b border-white/5 pb-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                {cat.category}
                            </h4>
                            <ul className="space-y-3">
                                {cat.items.map((item: string, j: number) => (
                                    <li key={j} className="text-sm text-slate-400 flex items-start gap-3 bg-black/20 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <ArrowRight className="w-4 h-4 text-blue-500/50 mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
          )}
          
          {/* Suggestions List */}
          {report?.results?.suggestions && report.results.suggestions.length > 0 && (
            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Strategic Action Plan
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {report.results.suggestions.map((s: string, i: number) => {
                   const { title, content, effort, eta } = parseSuggestion(s);
                   return (
                     <div key={i} className="p-5 bg-black/20 border border-white/5 rounded-2xl flex flex-col gap-3 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                           <h4 className="font-bold text-white text-sm">{title}</h4>
                           {effort && (
                             <span className={clsx(
                               "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold",
                               effort.trim().toLowerCase() === 'high' ? 'bg-red-500/20 text-red-400' :
                               effort.trim().toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                               'bg-emerald-500/20 text-emerald-400'
                             )}>
                               {effort}
                             </span>
                           )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{content}</p>
                        {eta && (
                          <div className="flex items-center gap-2 mt-1">
                             <History className="w-3 h-3 text-slate-500" />
                             <span className="text-[10px] text-slate-500 font-mono">{eta.replace('Expected:', '').trim()}</span>
                          </div>
                        )}
                     </div>
                   );
                })}
              </div>
            </div>
          )}
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
              disabled={runAnalysis.isPending || evaluation.status === 'completed' || evaluation.status === 'processing'}
              className="mt-6 text-sm font-bold text-blue-400 flex items-center gap-1 hover:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runAnalysis.isPending || evaluation.status === 'processing' ? 'Synchronizing Intelligence...' : evaluation.status === 'completed' ? 'Analysis synchronized' : 'Request Full Analysis'} 
            </button>
          </div>

          {/* History List */}
          {historyEvaluations && historyEvaluations.length > 1 && (
             <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
               <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                 <Clock className="w-4 h-4 text-slate-400" />
                 Evaluation History
               </h4>
               <div className="space-y-4">
                 {historyEvaluations.map((hist: any) => (
                   <Link 
                     href={`/evaluations/${hist.id}`} 
                     key={hist.id}
                     className={clsx(
                       "flex items-center justify-between p-3 rounded-xl border transition-all hover:bg-white/5",
                       hist.id === id ? "bg-blue-500/10 border-blue-500/20" : "bg-transparent border-transparent"
                     )}
                   >
                     <div className="flex flex-col">
                        <span className={clsx("text-xs font-bold", hist.id === id ? "text-blue-400" : "text-slate-300")}>
                          {new Date(hist.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">{hist.status}</span>
                     </div>
                     {hist.id === id && (
                         <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                     )}
                   </Link>
                 ))}
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
