'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight,
  Loader2,
  RefreshCw,
  Layout,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { clsx } from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    assetType: string;
    dimensions: { name: string; weight: number }[];
    ownerScope: string;
  }>({
    name: '',
    assetType: 'project',
    dimensions: [{ name: 'Security', weight: 40 }, { name: 'Performance', weight: 60 }],
    ownerScope: 'tenant'
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [templateToDeleteId, setTemplateToDeleteId] = useState<string | null>(null);

  const { 
    data: templates = [], 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiFetch<any[]>('/templates'),
  });

  const createTemplate = useMutation({
    mutationFn: (data: typeof newTemplate) => apiFetch('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsModalOpen(false);
      setNewTemplate({
        name: '',
        assetType: 'project',
        dimensions: [{ name: 'Security', weight: 40 }, { name: 'Performance', weight: 60 }],
        ownerScope: 'tenant'
      });
      toast.success('Framework created successfully');
    },
    onError: (err: any) => {
      toast.error(`Failed to create template: ${err.message}`);
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => apiFetch(`/templates/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Framework decommissioned.');
      setOpenDeleteDialog(false);
      setTemplateToDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(`Decommission failure: ${err.message}`);
      setOpenDeleteDialog(false);
      setTemplateToDeleteId(null);
    }
  });

  const confirmDelete = (id: string) => {
    setTemplateToDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteAction = () => {
    if (templateToDeleteId) {
      deleteTemplate.mutate(templateToDeleteId);
    }
  };

  const filteredTemplates = templates.filter((template: any) => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.assetType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalWeight = newTemplate.dimensions.reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight !== 100) {
      toast.error('Total weighting must equal 100%');
      return;
    }
    createTemplate.mutate(newTemplate);
  };

  const addDimension = () => {
    setNewTemplate({
      ...newTemplate,
      dimensions: [...newTemplate.dimensions, { name: '', weight: 0 }]
    });
  };

  const removeDimension = (index: number) => {
    const updated = [...newTemplate.dimensions];
    updated.splice(index, 1);
    setNewTemplate({ ...newTemplate, dimensions: updated });
  };

  const updateDimension = (index: number, field: 'name' | 'weight', value: string | number) => {
    const updated = [...newTemplate.dimensions];
    (updated[index] as any)[field] = value;
    setNewTemplate({ ...newTemplate, dimensions: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Framework Library</h2>
          <p className="text-slate-400 mt-1">
            Standardize your evaluation logic with custom scoring dimensions and weighting.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className={clsx("h-10 w-10", (isLoading || isRefetching) && "animate-spin")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-slate-900 font-black hover:bg-slate-200 shadow-xl shadow-white/10">
                <Plus className="h-4 w-4 mr-2" />
                Create Framework
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">New Framework Logic</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Framework Name</Label>
                    <Input
                      required
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Class</Label>
                    <Select
                      value={newTemplate.assetType}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, assetType: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select asset class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dimensions & Weighting</Label>
                    <Button type="button" variant="link" onClick={addDimension} className="text-[10px] text-blue-400 font-black uppercase tracking-widest p-0 h-auto">+ Add Dimension</Button>
                  </div>
                  
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto px-1">
                    {newTemplate.dimensions.map((dim, index) => (
                      <div key={index} className="flex gap-3">
                        <Input
                          required
                          placeholder="Dimension name"
                          value={dim.name}
                          onChange={(e) => updateDimension(index, 'name', e.target.value)}
                          className="flex-1 bg-white/5 border-white/10 text-white"
                        />
                        <Input
                          type="number"
                          required
                          placeholder="Weight %"
                          value={dim.weight}
                          onChange={(e) => updateDimension(index, 'weight', parseInt(e.target.value))}
                          className="w-24 bg-white/5 border-white/10 text-white text-right"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDimension(index)}
                          className="text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                   <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                     Total Weight: <span className={clsx(newTemplate.dimensions.reduce((s,d) => s+d.weight,0) === 100 ? "text-emerald-400" : "text-amber-400")}>
                       {newTemplate.dimensions.reduce((s,d) => s+d.weight, 0)}%
                     </span>
                   </div>
                   <Button
                    type="submit"
                    disabled={createTemplate.isPending}
                    className="bg-white text-slate-900 font-black hover:bg-slate-200 shadow-xl shadow-white/10"
                   >
                    Initialize Logic
                   </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            type="text" 
            placeholder="Search frameworks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p>Scanning framework registry...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white/5 border border-white/10 border-dashed p-24 rounded-3xl text-center">
          <p className="text-slate-400 italic">No frameworks registered. Create your first scoring logic above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template: any) => (
            <Card key={template.id} className="group relative bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Layout className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(template.id);
                          }}
                          disabled={deleteTemplate.isPending}
                          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            This action cannot be undone. This will permanently decommission this framework logic and remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAction}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{template.assetType}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{template.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.dimensions.map((dim: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px] bg-white/5 border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                        {dim.name} ({dim.weight}%)
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                  <Button 
                    variant="link" 
                    onClick={() => router.push(`/templates/${template.id}`)}
                    className="text-sm font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform p-0 h-auto"
                  >
                    Configure <ChevronRight className="h-4 w-4" />
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