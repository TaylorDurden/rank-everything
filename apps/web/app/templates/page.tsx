import { 
  Plus, 
  FileText, 
  Settings2, 
  MoreVertical,
  Layers,
  Globe
} from 'lucide-react';

const templates = [
  { id: '1', name: 'Security & Compliance', assetType: 'Software', dimensions: 12, scope: 'System', updatedAt: '2d ago' },
  { id: '2', name: 'Market Positioning', assetType: 'Product', dimensions: 8, scope: 'Tenant', updatedAt: '1w ago' },
  { id: '3', name: 'Hardware Reliability', assetType: 'Infrastructure', dimensions: 15, scope: 'System', updatedAt: '3d ago' },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
          <p className="text-muted-foreground">
            Define scoring dimensions and benchmarks for evaluations.
          </p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  template.scope === 'System' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <FileText className="h-6 w-6" />
                </div>
                <MoreVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
              </div>
              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{template.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Recommended for {template.assetType} assets.</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Dimensions
                  </span>
                  <span className="font-semibold">{template.dimensions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Scope
                  </span>
                  <span className={`font-medium ${template.scope === 'System' ? 'text-indigo-600' : 'text-amber-600'}`}>
                    {template.scope}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Last updated {template.updatedAt}</span>
              <button className="text-sm font-medium text-primary hover:underline">Edit</button>
            </div>
          </div>
        ))}
        
        {/* Empty State / Add Card */}
        <div className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer min-h-[220px]">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Settings2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Define Custom Template</p>
            <p className="text-xs text-muted-foreground px-4">Create a specialized template tailored to your specific asset types.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
