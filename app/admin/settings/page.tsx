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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Admin Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your API integration and system configuration</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Lead Generation API Configuration</CardTitle>
            </div>
            <CardDescription>Configure your API settings and credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable API</Label>
                <p className="text-sm text-muted-foreground">Turn on/off the lead generation API integration</p>
              </div>
              <Switch checked={data.isEnabled} onCheckedChange={(v) => setData({ ...data, isEnabled: v })} />
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={data.baseUrl}
                  onChange={(e) => setData({ ...data, baseUrl: e.target.value })}
                  placeholder="https://api.rocketreach.co"
                />
                <p className="text-sm text-muted-foreground">Lead Generation API base URL</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={data.hasApiKey ? '••••••••••••••••' : 'Enter your API key'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {data.hasApiKey ? 'Leave blank to keep existing key' : 'Required for API integration'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily API Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  value={data.dailyLimit}
                  onChange={(e) => setData({ ...data, dailyLimit: Number(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">Maximum API calls per day</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concurrency">Concurrency</Label>
                <Input
                  id="concurrency"
                  type="number"
                  value={data.concurrency}
                  onChange={(e) => setData({ ...data, concurrency: Number(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">Parallel API requests</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base">Retry Policy</Label>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxRetries">Max Retries</Label>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseDelay">Base Delay (ms)</Label>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDelay">Max Delay (ms)</Label>
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
                  />
                </div>
              </div>
            </div>

            {data.updatedAt && (
              <div className="text-sm text-muted-foreground pt-2">
                Last updated: {new Date(data.updatedAt).toLocaleString()}
                {data.updatedBy && ` by ${data.updatedBy}`}
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
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
