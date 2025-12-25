'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import { 
  ChevronLeft, 
  Save, 
  PlusCircle, 
  Trash2, 
  Layout, 
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function TemplateSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editedTemplate, setEditedTemplate] = useState<any>(null);

  const { data: template, isLoading, error } = useQuery({
    queryKey: ['template', id],
    queryFn: () => apiFetch<any>(`/templates/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (template) {
      setEditedTemplate(template);
    }
  }, [template]);

  const updateTemplate = useMutation({
    mutationFn: (data: any) => apiFetch(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Framework synchronization complete.');
      router.push('/templates');
    },
    onError: (err: any) => {
      toast.error(`Sync failure: ${err.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="font-bold tracking-widest uppercase text-xs">Loading Framework Architecture...</p>
      </div>
    );
  }

  const currentTemplate = editedTemplate || template;

  const addDimension = () => {
    setEditedTemplate({
      ...currentTemplate,
      dimensions: [...currentTemplate.dimensions, { name: '', weight: 0 }]
    });
  };

  const removeDimension = (index: number) => {
    const updated = [...currentTemplate.dimensions];
    updated.splice(index, 1);
    setEditedTemplate({ ...currentTemplate, dimensions: updated });
  };

  const updateDimension = (index: number, field: string, value: any) => {
    const updated = [...currentTemplate.dimensions];
    updated[index] = { ...updated[index], [field]: value };
    setEditedTemplate({ ...currentTemplate, dimensions: updated });
  };

  const totalWeight = currentTemplate?.dimensions.reduce((sum: number, d: any) => sum + Number(d.weight || 0), 0);

  const handleSave = () => {
    if (totalWeight !== 100) {
      toast.error('Total aggregate weighting must precisely equal 100%');
      return;
    }
    updateTemplate.mutate(currentTemplate);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/templates')} 
            className="flex items-center gap-2 text-slate-500 hover:text-blue-400 text-xs font-black uppercase tracking-widest mb-4 p-0 h-auto"
          >
            <ChevronLeft className="h-4 w-4" /> Framework Library
          </Button>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            {currentTemplate.name}
            <Sparkles className="w-6 h-6 text-purple-400" />
          </h1>
          <p className="text-slate-400 text-lg">
            Modify the scoring dimensions and weighting logic for this <span className="text-blue-400 font-bold">{currentTemplate.assetType}</span> matrix.
          </p>
        </div>
        <div className="flex gap-4">
          <Button 
             onClick={handleSave}
             disabled={updateTemplate.isPending}
             className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-200 shadow-xl shadow-white/10 active:scale-95"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateTemplate.isPending ? 'Syncing...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="backdrop-blur-3xl bg-white/5 border-white/10 rounded-[2.5rem] shadow-2xl space-y-8 p-8">
             <CardHeader className="flex flex-row items-center justify-between p-0">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Layout className="w-5 h-5 text-blue-500" />
                  Dimension Configuration
                </CardTitle>
                <Button 
                  onClick={addDimension}
                  className="px-4 py-2 bg-blue-500/10 border-blue-500/20 rounded-xl text-blue-400 text-xs font-bold hover:bg-blue-500/20"
                >
                  <PlusCircle className="w-3.5 h-3.5 inline mr-1" /> Add Dimension
                </Button>
             </CardHeader>

             <CardContent className="space-y-4 p-0">
                {currentTemplate.dimensions.map((dim: any, index: number) => (
                  <div key={index} className="flex gap-4 items-center group animate-in slide-in-from-right-2 duration-300">
                    <div className="flex-1">
                      <Input 
                        type="text"
                        value={dim.name}
                        onChange={(e) => updateDimension(index, 'name', e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Dimension label"
                      />
                    </div>
                    <div className="relative w-28">
                       <Input 
                        type="number"
                        value={dim.weight}
                        onChange={(e) => updateDimension(index, 'weight', e.target.value)}
                        className="w-full bg-white/5 border-white/10 pl-4 pr-10 text-white text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold uppercase">%</span>
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDimension(index)}
                      className="text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
             </CardContent>

             <div className={clsx(
               "p-6 rounded-2xl flex items-center justify-between border",
               totalWeight === 100 ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" : "bg-amber-500/5 border-amber-500/10 text-amber-400"
             )}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">Aggregate Weight Distribution</span>
                </div>
                <span className="text-2xl font-black font-mono">{totalWeight}%</span>
             </div>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="bg-white/5 border-white/10 rounded-[2.5rem] p-8">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                  Framework Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                <div>
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Framework Name</Label>
                  <Input 
                    type="text"
                    value={currentTemplate.name}
                    onChange={(e) => setEditedTemplate({...currentTemplate, name: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Asset Classification</Label>
                  <Select 
                    value={currentTemplate.assetType}
                    onValueChange={(value) => setEditedTemplate({...currentTemplate, assetType: value})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
           </Card>

           <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-700/20 border-white/10 rounded-[2.5rem] p-8">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  MCDM Warning
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Changing weights or adding dimensions will not retroactively update existing evaluations. New evaluations using this framework will use the updated signature.
                </p>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}