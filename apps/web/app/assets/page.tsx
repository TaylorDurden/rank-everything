import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  BarChart3,
  Tag as TagIcon
} from 'lucide-react';

// Mock data until API is fully integrated
const assets = [
  { id: '1', name: 'Enterprise Cloud AWS', type: 'Digital', status: 'Active', tags: ['Cloud', 'AWS'], updatedAt: '2h ago' },
  { id: '2', name: 'Office Building A', type: 'Physical', status: 'Draft', tags: ['Real Estate'], updatedAt: '5h ago' },
  { id: '3', name: 'MacBook Pro Fleet', type: 'Hardware', status: 'Active', tags: ['IT', 'Hardware'], updatedAt: '1d ago' },
  { id: '4', name: 'Customer Database', type: 'Data', status: 'Evaluating', tags: ['PII', 'Database'], updatedAt: '3d ago' },
];

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assets</h2>
          <p className="text-muted-foreground">
            Manage and track your digital and physical assets.
          </p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search assets..." 
            className="w-full pl-10 pr-4 py-2 bg-card border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button className="px-4 py-2 bg-card border rounded-md text-sm font-medium flex items-center gap-2 hover:bg-accent transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground font-medium uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-3">Asset Name</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Tags</th>
              <th className="px-6 py-3 text-right">Updated</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-muted/50 transition-colors cursor-pointer group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{asset.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{asset.type}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    asset.status === 'Active' ? 'bg-green-100 text-green-700' : 
                    asset.status === 'Evaluating' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {asset.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <TagIcon className="h-2 w-2" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">{asset.updatedAt}</td>
                <td className="px-6 py-4 text-right text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4 ml-auto cursor-pointer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
