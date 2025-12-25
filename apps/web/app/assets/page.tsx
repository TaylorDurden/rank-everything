'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  BarChart3,
  Tag as TagIcon,
  Loader2,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { clsx } from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Digital',
    description: '',
    status: 'active',
    metadata: {}
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [assetToDeleteId, setAssetToDeleteId] = useState<string | null>(null);

  const { 
    data: assets = [], 
    isLoading, 
    error, 
    refetch, 
    isRefetching 
  } = useQuery({
    queryKey: ['assets'],
    queryFn: () => apiFetch<any[]>('/assets'),
  });

  const createAsset = useMutation({
    mutationFn: (data: typeof newAsset) => apiFetch('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setNewAsset({ name: '', type: 'Digital', description: '', status: 'active', metadata: {} });
      toast.success('Asset created successfully');
    },
    onError: (err: any) => {
      toast.error(`Failed to create asset: ${err.message}`);
    }
  });

  const deleteAsset = useMutation({
    mutationFn: (id: string) => apiFetch(`/assets/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset removed from registry.');
      setOpenDeleteDialog(false);
      setAssetToDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(`Delete failure: ${err.message}`);
      setOpenDeleteDialog(false);
      setAssetToDeleteId(null);
    }
  });

  const confirmDelete = (id: string) => {
    setAssetToDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteAction = () => {
    if (assetToDeleteId) {
      deleteAsset.mutate(assetToDeleteId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAsset.mutate(newAsset);
  };

  const filteredAssets = assets.filter((asset: any) => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Assets</h2>
          <p className="text-slate-400 mt-1">
            Manage and track your digital and physical assets across the organization.
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
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">New Asset Registration</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-500 uppercase tracking-widest text-xs font-bold">Asset Identity</Label>
                  <Input
                    id="name"
                    required
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="e.g. Core Banking System"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-slate-500 uppercase tracking-widest text-xs font-bold">Classification</Label>
                  <Select
                    value={newAsset.type}
                    onValueChange={(value) => setNewAsset({ ...newAsset, type: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Digital">Digital (SaaS, Cloud, Data)</SelectItem>
                      <SelectItem value="Physical">Physical (Hardware, Infrastructure)</SelectItem>
                      <SelectItem value="Process">Process (Operations, Workflow)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-500 uppercase tracking-widest text-xs font-bold">Description & Context</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={newAsset.description}
                    onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Provide a brief overview of the asset's business value..."
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={createAsset.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-6 rounded-xl shadow-xl shadow-blue-500/20"
                  >
                    {createAsset.isPending ? 'Syncing with Registry...' : 'Initialize Asset'}
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
            placeholder="Search assets by name, type or status..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Button variant="outline" className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center">
          <p className="text-red-400 font-medium">Failed to load assets</p>
          <p className="text-red-400/60 text-sm mt-1">{(error as Error).message}</p>
          <Button 
            variant="destructive"
            onClick={() => refetch()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="animate-pulse">Fetching assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white/5 border border-white/10 border-dashed p-24 rounded-3xl text-center">
          <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400">No assets found</p>
          <p className="text-slate-600 text-sm mt-1">Get started by adding your first asset to the platform.</p>
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="px-8 py-4 text-slate-400 font-semibold uppercase text-[10px] tracking-[0.1em]">Asset Name</TableHead>
                  <TableHead className="px-8 py-4 text-slate-400 font-semibold uppercase text-[10px] tracking-[0.1em]">Category</TableHead>
                  <TableHead className="px-8 py-4 text-slate-400 font-semibold uppercase text-[10px] tracking-[0.1em]">System Status</TableHead>
                  <TableHead className="px-8 py-4 text-slate-400 font-semibold uppercase text-[10px] tracking-[0.1em]">Identity Tags</TableHead>
                  <TableHead className="px-8 py-4 text-right text-slate-400 font-semibold uppercase text-[10px] tracking-[0.1em]">Last Sync</TableHead>
                  <TableHead className="px-8 py-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset: any) => (
                  <TableRow key={asset.id} className="hover:bg-white/[0.02] border-white/5 group cursor-pointer">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                          <BarChart3 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">{asset.name}</span>
                          <span className="text-xs text-slate-500 font-mono mt-0.5">{asset.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 rounded text-[11px] font-medium uppercase tracking-wider hover:bg-slate-700">
                        {asset.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                        asset.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                        asset.status === 'Evaluating' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : 
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      )}>
                        <span className={clsx("h-1.5 w-1.5 rounded-full", asset.status === 'active' ? "bg-emerald-400" : asset.status === 'Evaluating' ? "bg-blue-400" : "bg-amber-400")} />
                        {asset.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <div className="flex flex-wrap gap-2">
                        {asset.tags?.length > 0 ? asset.tags.map((tag: any) => (
                          <span key={tag.id || tag} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                            <TagIcon className="h-2.5 w-2.5" />
                            {tag.name || tag}
                          </span>
                        )) : <span className="text-slate-600 italic text-[11px]">No tags</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right text-slate-500 font-mono text-xs uppercase">
                      {new Date(asset.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete(asset.id);
                              }}
                              disabled={deleteAsset.isPending}
                              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                This action cannot be undone. This will permanently delete your asset and remove its data from our servers.
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="bg-white/5 px-8 py-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-500">Showing {assets.length} evaluation assets</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled className="text-xs bg-white/5 border-white/5 text-slate-600 hover:bg-white/5">Previous</Button>
                <Button variant="outline" size="sm" disabled className="text-xs bg-white/5 border-white/5 text-slate-600 hover:bg-white/5">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}