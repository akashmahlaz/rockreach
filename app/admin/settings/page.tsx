'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, Shield } from 'lucide-react';

interface Settings {
  isEnabled: boolean;
  baseUrl: string;
  dailyLimit: number;
  concurrency: number;
  retryPolicy: { maxRetries: number; baseDelayMs: number; maxDelayMs: number };
  hasApiKey: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Settings | null>(null);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch('/api/admin/rocketreach-settings', { cache: 'no-store' });
      const json = await res.json();
      setData(
        json.data || {
          isEnabled: true,
          baseUrl: 'https://api.rocketreach.co',
          dailyLimit: 1000,
          concurrency: 2,
          retryPolicy: { maxRetries: 5, baseDelayMs: 500, maxDelayMs: 30000 },
          hasApiKey: false,
        }
      );
    } catch (error) {
      toast.error('Failed to load settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!data) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/rocketreach-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, apiKey: apiKey || undefined }),
      });
      const json = await res.json();
      
      if (json.ok) {
        toast.success('Settings saved successfully');
        setApiKey('');
        setData((d) => (d ? { ...d, hasApiKey: json.hasApiKey } : d));
      } else {
        toast.error(json.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F5F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#605A57]" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Admin Settings</h1>
          <p className="text-[#605A57] mt-2">Manage your RocketReach integration and system configuration</p>
        </div>

        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#37322F]" />
              <CardTitle className="text-[#37322F]">RocketReach API Configuration</CardTitle>
            </div>
            <CardDescription className="text-[#605A57]">Configure your RocketReach API settings and credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base text-[#37322F]">Enable RocketReach</Label>
                <p className="text-sm text-[#605A57]">Turn on/off the RocketReach integration</p>
              </div>
              <Switch checked={data.isEnabled} onCheckedChange={(v) => setData({ ...data, isEnabled: v })} />
            </div>

            <Separator className="bg-[rgba(55,50,47,0.12)]" />

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl" className="text-[#37322F]">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={data.baseUrl}
                  onChange={(e) => setData({ ...data, baseUrl: e.target.value })}
                  placeholder="https://api.rocketreach.co"
                  className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                />
                <p className="text-sm text-[#605A57]">RocketReach API base URL</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-[#37322F]">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={data.hasApiKey ? '••••••••••••••••' : 'Enter your RocketReach API key'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                />
                <p className="text-sm text-[#605A57]">
                  {data.hasApiKey ? 'Leave blank to keep existing key' : 'Required for RocketReach integration'}
                </p>
              </div>
            </div>

            <Separator className="bg-[rgba(55,50,47,0.12)]" />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyLimit" className="text-[#37322F]">Daily API Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  value={data.dailyLimit}
                  onChange={(e) => setData({ ...data, dailyLimit: Number(e.target.value) })}
                  className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                />
                <p className="text-sm text-[#605A57]">Maximum API calls per day</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concurrency" className="text-[#37322F]">Concurrency</Label>
                <Input
                  id="concurrency"
                  type="number"
                  value={data.concurrency}
                  onChange={(e) => setData({ ...data, concurrency: Number(e.target.value) })}
                  className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                />
                <p className="text-sm text-[#605A57]">Parallel API requests</p>
              </div>
            </div>

            <Separator className="bg-[rgba(55,50,47,0.12)]" />

            <div className="space-y-4">
              <Label className="text-base text-[#37322F]">Retry Policy</Label>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxRetries" className="text-[#37322F]">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={data.retryPolicy.maxRetries}
                    onChange={(e) =>
                      setData({
                        ...data,
                        retryPolicy: { ...data.retryPolicy, maxRetries: Number(e.target.value) },
                      })
                    }
                    className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseDelay" className="text-[#37322F]">Base Delay (ms)</Label>
                  <Input
                    id="baseDelay"
                    type="number"
                    value={data.retryPolicy.baseDelayMs}
                    onChange={(e) =>
                      setData({
                        ...data,
                        retryPolicy: { ...data.retryPolicy, baseDelayMs: Number(e.target.value) },
                      })
                    }
                    className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDelay" className="text-[#37322F]">Max Delay (ms)</Label>
                  <Input
                    id="maxDelay"
                    type="number"
                    value={data.retryPolicy.maxDelayMs}
                    onChange={(e) =>
                      setData({
                        ...data,
                        retryPolicy: { ...data.retryPolicy, maxDelayMs: Number(e.target.value) },
                      })
                    }
                    className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                  />
                </div>
              </div>
            </div>

            {data.updatedAt && (
              <div className="text-sm text-[#605A57] pt-2">
                Last updated: {new Date(data.updatedAt).toLocaleString()}
                {data.updatedBy && ` by ${data.updatedBy}`}
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#37322F] text-white hover:bg-[#37322F]/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
