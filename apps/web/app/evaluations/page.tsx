import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MoreVertical,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

const evaluations = [
  { id: '1', assetName: 'Enterprise Cloud AWS', templateName: 'Security & Compliance', status: 'Completed', score: '92/100', updatedAt: '2h ago' },
  { id: '2', assetName: 'Office Building A', templateName: 'Physical Safety', status: 'In Progress', progress: 65, updatedAt: '5h ago' },
  { id: '3', assetName: 'MacBook Pro Fleet', templateName: 'Hardware Value', status: 'Review Required', updatedAt: '1d ago' },
];

export default function EvaluationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Evaluations</h2>
          <p className="text-muted-foreground">
            Track and manage your asset scoring sessions.
          </p>
        </div>
        <Link 
          href="/evaluations/new" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Evaluation
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search evaluations..." 
          className="w-full pl-10 pr-4 py-2 bg-card border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid gap-4">
        {evaluations.map((evalItem) => (
          <div key={evalItem.id} className="p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  evalItem.status === 'Completed' ? 'bg-green-100' : 
                  evalItem.status === 'In Progress' ? 'bg-blue-100' : 'bg-yellow-100'
                }`}>
                  <ClipboardList className={`h-6 w-6 ${
                    evalItem.status === 'Completed' ? 'text-green-700' : 
                    evalItem.status === 'In Progress' ? 'text-blue-700' : 'text-yellow-700'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{evalItem.assetName}</h3>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                      {evalItem.templateName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {evalItem.status === 'Completed' ? <CheckCircle2 className="h-3 w-3" /> : 
                       evalItem.status === 'In Progress' ? <Clock className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {evalItem.status}
                    </span>
                    <span>•</span>
                    <span>Updated {evalItem.updatedAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {evalItem.status === 'In Progress' ? (
                  <div className="w-32">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-medium text-muted-foreground">Progress</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{evalItem.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${evalItem.progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Score</p>
                    <p className="text-xl font-bold text-primary">{evalItem.score || 'N/A'}</p>
                  </div>
                )}
                <MoreVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
