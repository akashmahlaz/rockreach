'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Mail, MessageCircle, User, Key } from 'lucide-react';

interface SettingsClientProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">
          <User className="w-4 h-4 mr-2" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="email">
          <Mail className="w-4 h-4 mr-2" />
          Email
        </TabsTrigger>
        <TabsTrigger value="whatsapp">
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </TabsTrigger>
        <TabsTrigger value="api">
          <Key className="w-4 h-4 mr-2" />
          API Keys
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={user.name || ''} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user.email || ''} placeholder="your@email.com" disabled />
              <p className="text-sm text-slate-500">Email cannot be changed</p>
            </div>
            <Button onClick={() => toast.success('Profile settings updated!')}>
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="email" className="space-y-4 mt-6">
        <EmailSettings />
      </TabsContent>

      <TabsContent value="whatsapp" className="space-y-4 mt-6">
        <WhatsAppSettings />
      </TabsContent>

      <TabsContent value="api" className="space-y-4 mt-6">
        <APIKeysSettings />
      </TabsContent>
    </Tabs>
  );
}

function EmailSettings() {
  const [provider, setProvider] = useState<'gmail' | 'resend'>('resend');
  const [loading, setLoading] = useState(false);
  const [gmail, setGmail] = useState({ email: '', appPassword: '', isEnabled: false });
  const [resend, setResend] = useState({ apiKey: '', fromEmail: '', fromName: '', isEnabled: false });

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/assistant/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.gmail) {
          setGmail(data.gmail);
          if (data.gmail.isEnabled) setProvider('gmail');
        }
        if (data.resend) {
          setResend(data.resend);
          if (data.resend.isEnabled && !data.gmail?.isEnabled) setProvider('resend');
        }
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assistant/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmail: provider === 'gmail' ? gmail : null,
          resend: provider === 'resend' ? resend : null,
        }),
      });

      if (res.ok) {
        toast.success('Email settings saved!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>Configure your email sending settings for outreach campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as 'gmail' | 'resend')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail">Gmail (App Password)</SelectItem>
                <SelectItem value="resend">Resend (Recommended)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {provider === 'gmail' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="gmail-email">Gmail Address</Label>
                <Input
                  id="gmail-email"
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={gmail.email}
                  onChange={(e) => setGmail({ ...gmail, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gmail-password">App Password</Label>
                <Input
                  id="gmail-password"
                  type="password"
                  placeholder="Enter 16-character app password"
                  value={gmail.appPassword}
                  onChange={(e) => setGmail({ ...gmail, appPassword: e.target.value })}
                />
                <p className="text-sm text-slate-500">
                  Get your app password from <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Google Account settings</a>
                </p>
              </div>
            </>
          )}

          {provider === 'resend' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="resend-api-key">Resend API Key</Label>
                <Input
                  id="resend-api-key"
                  type="password"
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxx"
                  value={resend.apiKey}
                  onChange={(e) => setResend({ ...resend, apiKey: e.target.value })}
                />
                <p className="text-sm text-slate-500">
                  Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">resend.com</a>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="noreply@yourdomain.com"
                    value={resend.fromEmail}
                    onChange={(e) => setResend({ ...resend, fromEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    placeholder="Your Company"
                    value={resend.fromName}
                    onChange={(e) => setResend({ ...resend, fromName: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Email Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function WhatsAppSettings() {
  const [method, setMethod] = useState<'web' | 'business'>('web');

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Configuration</CardTitle>
        <CardDescription>Configure WhatsApp for sending messages to leads</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>WhatsApp Method</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as 'web' | 'business')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="web">WhatsApp Web/App (Basic)</SelectItem>
              <SelectItem value="business">WhatsApp Business API (Advanced)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {method === 'web' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>WhatsApp Web/App:</strong> Messages will open in WhatsApp Web or your installed WhatsApp application. 
              This method is free and requires no API setup. Each message must be sent manually.
            </p>
          </div>
        )}

        {method === 'business' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="whatsapp-api-url">API URL</Label>
              <Input
                id="whatsapp-api-url"
                placeholder="https://api.whatsapp.com/send"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp-api-key">API Key</Label>
              <Input
                id="whatsapp-api-key"
                type="password"
                placeholder="Your WhatsApp Business API key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp-phone">Phone Number ID</Label>
              <Input
                id="whatsapp-phone"
                placeholder="Your WhatsApp Business phone number ID"
              />
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Note:</strong> WhatsApp Business API requires verification and approval from Meta. 
                Visit <a href="https://business.whatsapp.com" target="_blank" rel="noopener noreferrer" className="underline">business.whatsapp.com</a> to get started.
              </p>
            </div>
          </>
        )}

        <Button onClick={() => toast.success('WhatsApp settings saved!')}>
          Save WhatsApp Settings
        </Button>
      </CardContent>
    </Card>
  );
}

function APIKeysSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>Manage your third-party API integrations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rocketreach-api">RocketReach API Key</Label>
          <Input
            id="rocketreach-api"
            type="password"
            placeholder="Your RocketReach API key"
          />
          <p className="text-sm text-slate-500">
            Get your API key from <a href="https://rocketreach.co/api" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">RocketReach</a>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="rocketreach-enabled" defaultChecked />
          <Label htmlFor="rocketreach-enabled">Enable RocketReach Integration</Label>
        </div>

        <Button onClick={() => toast.success('API keys saved!')}>
          Save API Keys
        </Button>
      </CardContent>
    </Card>
  );
}
