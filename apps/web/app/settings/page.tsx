'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Building, 
  Shield, 
  Bell, 
  CreditCard,
  Trash2,
  Save,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({ name: '', bio: '' });
  const [orgName, setOrgName] = useState('');

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: () => apiFetch<any>('/tenants/' + JSON.parse(localStorage.getItem('user') || '{}').tenantId),
    enabled: typeof window !== 'undefined',
  });

  useEffect(() => {
    if (tenant) {
      setOrgName(tenant.name);
    }
  }, [tenant]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFormData({ name: parsed.name || '', bio: parsed.bio || '' });
    }
  }, []);

  const updateProfile = useMutation({
    mutationFn: (data: any) => apiFetch('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: (updatedUser) => {
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('Profile synchronization complete.');
    },
    onError: (err: any) => {
      toast.error(`Sync failure: ${err.message}`);
    }
  });

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  const updateOrg = useMutation({
    mutationFn: (name: string) => apiFetch('/tenants/current', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Organization parameters updated.');
    },
    onError: (err: any) => {
      toast.error(`Sync failure: ${err.message}`);
    }
  });

  const handleSaveOrg = () => {
    updateOrg.mutate(orgName);
  };

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'organization', name: 'Organization', icon: Building },
    { id: 'security', name: 'Security & Auth', icon: Shield },
    { id: 'billing', name: 'Subscription', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">System Settings</h2>
        <p className="text-slate-400 mt-1">
          Manage your account preferences, organization details, and security configuration.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "w-full justify-start gap-3 px-4 py-6 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
              {activeTab === tab.id && <ChevronRight className="ml-auto w-4 h-4" />}
            </Button>
          ))}
          <div className="pt-8 px-4">
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Danger Zone</p>
              <Button variant="link" className="flex items-center gap-2 text-xs text-red-500 hover:text-red-400 font-bold transition-colors p-0 h-auto">
                <Trash2 className="w-3.5 h-3.5" /> Deactivate Account
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
            <CardContent className="p-0">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px]" />
              
              {activeTab === 'profile' && (
                <div className="space-y-8 relative">
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Public Profile</h3>
                      <p className="text-slate-500 mt-1">This information will be visible to your organization members.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</Label>
                      <Input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Email Identifier</Label>
                      <Input 
                        type="email" 
                        defaultValue={user?.email}
                        disabled
                        className="bg-slate-900/50 border-white/5 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Professional Bio</Label>
                    <Textarea 
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Describe your role in asset management..."
                    />
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-end">
                    <Button 
                      onClick={handleSave}
                      disabled={updateProfile.isPending}
                      className="bg-white text-slate-900 px-8 rounded-xl font-black hover:bg-slate-200"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfile.isPending ? 'Syncing...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'organization' && (
                <div className="space-y-8 relative animate-in fade-in duration-500">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Organization Parameters</h3>
                    <p className="text-slate-500 mt-1">Configure your corporate identity and system-wide identifiers.</p>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Organization Name</Label>
                      <Input 
                        type="text" 
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Tenant ID</Label>
                          <Input 
                            type="text" 
                            value={tenant?.id || ''}
                            disabled
                            className="bg-slate-900/50 border-white/5 text-slate-500 font-mono text-xs cursor-not-allowed"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Account Scope</Label>
                          <div className="w-full flex h-10 items-center bg-slate-900/50 border border-white/5 rounded-md px-3 text-slate-500 text-sm font-bold">
                            Enterprise
                          </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-end">
                    <Button 
                      onClick={handleSaveOrg}
                      disabled={updateOrg.isPending}
                      className="bg-white text-slate-900 px-8 rounded-xl font-black hover:bg-slate-200"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateOrg.isPending ? 'Syncing...' : 'Update Organization'}
                    </Button>
                  </div>
                </div>
              )}

              {['security', 'billing', 'notifications'].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center text-slate-600">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Feature in Development</h4>
                    <p className="text-slate-500 max-w-xs mt-1">The {tabs.find(t => t.id === activeTab)?.name} control panel is currently being synchronized with our production environment.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}