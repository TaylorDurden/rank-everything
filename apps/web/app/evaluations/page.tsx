'use client';

import { 
  Plus, 
  Search, 
  Sparkles, 
  ChevronRight,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

export default function EvaluationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [evaluationToDeleteId, setEvaluationToDeleteId] = useState<string | null>(null);

  const { 
    data: evaluations = [], 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => apiFetch<any[]>('/evaluations'),
  });

  const deleteEvaluation = useMutation({
    mutationFn: (id: string) => apiFetch(`/evaluations/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast.success('Evaluation record purged.');
      setOpenDeleteDialog(false);
      setEvaluationToDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(`Purge failure: ${err.message}`);
      setOpenDeleteDialog(false);
      setEvaluationToDeleteId(null);
    }
  });

  const confirmDelete = (id: string) => {
    setEvaluationToDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteAction = () => {
    if (evaluationToDeleteId) {
      deleteEvaluation.mutate(evaluationToDeleteId);
    }
  };

  const filteredEvaluations = evaluations.filter((ev: any) => 
    ev.asset?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.template?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Active Evaluations</h2>
          <p className="text-slate-400 mt-1">
            Track and manage ongoing asset assessments and scoring progress.
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
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20">
            <Link href="/evaluations/new">
              <Plus className="h-4 w-4 mr-2" />
              New Evaluation
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            type="text" 
            placeholder="Search by asset, template or status..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center">
          <p className="text-red-400 font-medium">Failed to load evaluations</p>
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
          <p>Gathering status reports...</p>
        </div>
      ) : evaluations.length === 0 ? (
        <div className="bg-white/5 border border-white/10 border-dashed p-24 rounded-3xl text-center">
          <Sparkles className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400">No active evaluations in progress</p>
          <Button variant="link" asChild className="mt-4 text-blue-400">
            <Link href="/evaluations/new">Start assessment</Link>
          </Button>
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="px-8 py-4 text-slate-400 font-semibold uppercase text-[10px] tracking-widest">Assessment Target</TableHead>
                  <TableHead className="px-8 py-4 text-slate-400 font-semibold uppercase text-[10px] tracking-widest">Applied Framework</TableHead>
                  <TableHead className="px-8 py-4 text-slate-400 font-semibold uppercase text-[10px] tracking-widest">Current Phase</TableHead>
                  <TableHead className="px-8 py-4 text-slate-400 font-semibold uppercase text-[10px] tracking-widest">Progress</TableHead>
                  <TableHead className="px-8 py-4 text-right text-slate-400 font-semibold uppercase text-[10px] tracking-widest">Updated</TableHead>
                  <TableHead className="px-8 py-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map((evalItem: any) => (
                  <TableRow 
                    key={evalItem.id} 
                    onClick={() => router.push(`/evaluations/${evalItem.id}`)}
                    className="hover:bg-white/[0.02] border-white/5 group cursor-pointer"
                  >
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Sparkles className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{evalItem.asset?.name || 'Unknown Asset'}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-tighter uppercase">ID: {evalItem.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-medium">{evalItem.template?.name || 'Standard Matrix'}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">{evalItem.template?.assetType} Framework</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm",
                        evalItem.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                        evalItem.status === 'in-progress' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : 
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      )}>
                        {evalItem.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                         evalItem.status === 'in-progress' ? <Clock className="w-3.5 h-3.5" /> : 
                         <AlertCircle className="w-3.5 h-3.5" />}
                        {evalItem.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 py-6 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                            style={{ width: `${evalItem.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-400 w-8 text-right">{evalItem.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right text-slate-500 font-mono text-xs uppercase">
                      {new Date(evalItem.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all gap-2">
                        <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete(evalItem.id);
                              }}
                              disabled={deleteEvaluation.isPending}
                              className="h-9 w-9 text-slate-400 hover:text-red-400 hover:bg-red-500/5"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                This action cannot be undone. This will permanently delete this evaluation record and all associated data.
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
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-white/5">
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}