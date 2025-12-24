import { 
  BarChart3, 
  ClipboardList, 
  FileText, 
  TrendingUp,
  ArrowUpRight,
  Plus
} from 'lucide-react';

const stats = [
  { name: 'Total Assets', value: '12', icon: BarChart3, change: '+2', changeType: 'positive' },
  { name: 'Active Evaluations', value: '4', icon: ClipboardList, change: '+1', changeType: 'positive' },
  { name: 'Reports Generated', value: '28', icon: FileText, change: '+5', changeType: 'positive' },
  { name: 'Avg. Rating', value: '8.4', icon: TrendingUp, change: '+0.2', changeType: 'positive' },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, John</h2>
        <p className="text-muted-foreground">
          Here is what's happening with your assets today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="p-6 bg-card border rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-muted-foreground" />
              <span className={stat.changeType === 'positive' ? 'text-green-600 text-xs font-medium flex items-center' : 'text-red-600 text-xs font-medium flex items-center'}>
                {stat.change}
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 bg-card border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Assets</h3>
            <button className="text-xs font-medium text-primary hover:underline flex items-center">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Enterprise Cloud Service {i}</p>
                    <p className="text-xs text-muted-foreground">Updated 2h ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-card border rounded-xl shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">New Evaluation</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Start a new evaluation for your digital or physical assets.
            </p>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            Start Now
          </button>
        </div>
      </div>
    </div>
  );
}
