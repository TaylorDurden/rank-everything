'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Settings2, 
  Target, 
  FileCheck,
  ClipboardList,
  Sparkles,
  Zap,
  Upload,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const steps = [
  { id: 'template', name: 'Framework', icon: Settings2 },
  { id: 'asset', name: 'Asset', icon: Target },
  { id: 'scoring', name: 'Analysis', icon: ClipboardList },
  { id: 'review', name: 'Evaluation', icon: FileCheck },
];

export default function NewEvaluationWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [selection, setSelection] = useState({
    templateId: '',
    assetId: '',
  });
  const [importMode, setImportMode] = useState<'select' | 'upload' | 'scrape'>('select');
  const [scrapeUrl, setScrapeUrl] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiFetch<any[]>('/templates'),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => apiFetch<any[]>('/assets'),
  });

  const createEvaluation = useMutation({
    mutationFn: (body: any) => apiFetch('/evaluations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      if (data && (data as any).id) {
          router.push(`/evaluations/${(data as any).id}`);
      } else {
          router.push('/evaluations');
      }
    },
    onError: (err: any) => {
      toast.error(`Failed to create evaluation: ${err.message}`);
    }
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : '';

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/assets/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      if (data.assets && data.assets.length > 0) {
        setSelection({ ...selection, assetId: data.assets[0].id });
        setImportMode('select');
        toast.success(`Successfully imported ${data.assets.length} asset(s)`);
      }
    },
    onError: (err: any) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const scrapeUrlMutation = useMutation({
    mutationFn: (url: string) => apiFetch('/assets/scrape', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      if (data.asset) {
        setSelection({ ...selection, assetId: data.asset.id });
        setImportMode('select');
        toast.success('Successfully scraped URL and created asset');
      }
    },
    onError: (err: any) => {
      toast.error(`Scraping failed: ${err.message}`);
    },
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleFinish = () => {
    createEvaluation.mutate({
      templateId: selection.templateId,
      assetId: selection.assetId,
      method: 'manual',
      progress: 50,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          Evaluation Wizard
          <Sparkles className="w-8 h-8 text-blue-500" />
        </h2>
        <p className="text-slate-400 mt-3 text-lg max-w-2xl mx-auto">
          Configure and initiate your next strategic asset assessment using our multi-criteria matrix system.
        </p>
      </div>

      {/* Stepper */}
      <nav aria-label="Progress" className="hidden sm:block">
        <ol className="flex items-center justify-between relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 -z-10" />
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            
            return (
              <li key={step.id} className="bg-[#0f172a] px-4 flex flex-col items-center gap-3 group">
                <div className={clsx(
                  "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
                  isCompleted ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" :
                  isActive ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110" :
                  "bg-slate-900 border-white/10 text-slate-600 group-hover:border-white/20"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-7 w-7" /> : <step.icon className="h-6 w-6" />}
                </div>
                <span className={clsx(
                  "text-xs font-black uppercase tracking-widest transition-colors",
                  isActive ? "text-blue-400" : isCompleted ? "text-emerald-400" : "text-slate-600"
                )}>
                  {step.name}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Content Area */}
      <div className="min-h-[500px] backdrop-blur-3xl bg-white/5 border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px]" />
        
        {currentStep === 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 relative">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Settings2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Select Scoring Framework</h3>
                <p className="text-slate-500">Choose a predefined matrix based on your asset type.</p>
              </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              {templates.map((template: any) => (
                <div 
                  key={template.id} 
                  onClick={() => setSelection({ ...selection, templateId: template.id })}
                  className={clsx(
                    "p-6 border-2 rounded-3xl cursor-pointer transition-all group relative overflow-hidden",
                    selection.templateId === template.id 
                      ? "border-blue-500 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.15)]" 
                      : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/[0.08]"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className={clsx(
                      "font-bold text-lg transition-colors",
                      selection.templateId === template.id ? "text-blue-400" : "text-white group-hover:text-white"
                    )}>{template.name}</p>
                    <div className={clsx(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                      selection.templateId === template.id ? "border-blue-500" : "border-slate-700"
                    )}>
                      {selection.templateId === template.id && <div className="h-3 w-3 rounded-full bg-blue-500 animate-in zoom-in" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{template.assetType} Framework • {template.dimensions?.length} Steps</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 relative">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Select Target Asset</h3>
                <p className="text-slate-500">Pick the asset you want to synchronize with the selected framework.</p>
              </div>
            </div>

            {/* Import Mode Tabs */}
            <div className="flex gap-2 border-b border-white/5">
              <button
                onClick={() => setImportMode('select')}
                className={clsx(
                  "px-6 py-3 font-bold text-sm transition-all border-b-2",
                  importMode === 'select'
                    ? "text-purple-400 border-purple-400"
                    : "text-slate-500 border-transparent hover:text-white"
                )}
              >
                Select Existing
              </button>
              <button
                onClick={() => setImportMode('upload')}
                className={clsx(
                  "px-6 py-3 font-bold text-sm transition-all border-b-2",
                  importMode === 'upload'
                    ? "text-purple-400 border-purple-400"
                    : "text-slate-500 border-transparent hover:text-white"
                )}
              >
                Upload File
              </button>
              <button
                onClick={() => setImportMode('scrape')}
                className={clsx(
                  "px-6 py-3 font-bold text-sm transition-all border-b-2",
                  importMode === 'scrape'
                    ? "text-purple-400 border-purple-400"
                    : "text-slate-500 border-transparent hover:text-white"
                )}
              >
                Scrape URL
              </button>
            </div>

            {importMode === 'select' && (
              <div className="grid gap-4">
                {assets.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No assets found. Create one or import from file/URL.</p>
                  </div>
                ) : (
                  assets.map((asset: any) => (
                    <div 
                      key={asset.id} 
                      onClick={() => setSelection({ ...selection, assetId: asset.id })}
                      className={clsx(
                        "p-5 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between",
                        selection.assetId === asset.id 
                          ? "border-purple-500 bg-purple-500/5" 
                          : "border-white/5 bg-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                          <Target className={clsx("w-5 h-5", selection.assetId === asset.id ? "text-purple-400" : "text-slate-500")} />
                        </div>
                        <div>
                          <p className="font-bold text-white">{asset.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{asset.type}</p>
                        </div>
                      </div>
                      <div className={clsx(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selection.assetId === asset.id ? "border-purple-500" : "border-slate-700"
                      )}>
                        {selection.assetId === asset.id && <div className="h-3 w-3 rounded-full bg-purple-500 animate-in zoom-in" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {importMode === 'upload' && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                  <p className="text-white font-bold mb-2">Upload CSV or JSON File</p>
                  <p className="text-sm text-slate-500 mb-6">Supported formats: CSV, JSON (max 10MB)</p>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadFile.mutate(file);
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                    disabled={uploadFile.isPending}
                  />
                  <label
                    htmlFor="file-upload"
                    className={clsx(
                      "inline-block px-6 py-3 rounded-xl font-bold cursor-pointer transition-all",
                      uploadFile.isPending
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                    )}
                  >
                    {uploadFile.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 inline-block mr-2" />
                        Choose File
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {importMode === 'scrape' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-white">
                    URL to Scrape
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={() => {
                        if (scrapeUrl) {
                          scrapeUrlMutation.mutate(scrapeUrl);
                        }
                      }}
                      disabled={!scrapeUrl || scrapeUrlMutation.isPending}
                      className={clsx(
                        "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                        scrapeUrlMutation.isPending || !scrapeUrl
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : "bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                      )}
                    >
                      {scrapeUrlMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Scrape
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    We'll extract metadata, Open Graph tags, and structured data from the URL.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep >= 2 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in zoom-in duration-500">
            <div className="h-20 w-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-2xl">
              <Zap className="h-10 w-10 text-blue-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">AI Engine Integration</h3>
              <p className="text-slate-500 max-w-sm">The background AI analysis for scoring and rationale will begin once you confirm the setup.</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl w-full max-w-md text-left space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 uppercase font-bold tracking-widest">Selected Framework</span>
                <span className="text-blue-400 font-bold">{templates.find((t: any) => t.id === selection.templateId)?.name || 'None'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 uppercase font-bold tracking-widest">Target Asset</span>
                <span className="text-purple-400 font-bold">{assets.find((a: any) => a.id === selection.assetId)?.name || 'None'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center py-6 px-4">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="group px-8 py-3.5 rounded-2xl border-2 border-white/5 font-bold text-sm text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all flex items-center gap-2"
        >
          <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Previous Step
        </button>
        
        {currentStep === steps.length - 1 ? (
          <button
            onClick={handleFinish}
            disabled={createEvaluation.isPending || !selection.assetId || !selection.templateId}
            className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-2xl shadow-blue-500/20 transition-all active:scale-95 disabled:grayscale disabled:opacity-50 flex items-center gap-2"
          >
            {createEvaluation.isPending ? 'Initializing Engine...' : 'Authorize Evaluation'}
            <Sparkles className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={(currentStep === 0 && !selection.templateId) || (currentStep === 1 && !selection.assetId)}
            className="group px-10 py-3.5 rounded-2xl bg-white text-slate-900 font-black text-sm hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            Next Phase
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}
