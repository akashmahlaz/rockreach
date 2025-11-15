'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { AIProviderSettings } from '@/models/ProviderSettings';

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o' },
  { value: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-3-5-sonnet-20241022' },
  { value: 'google', label: 'Google Vertex AI', defaultModel: 'gemini-1.5-pro' },
  { value: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-2.0-flash-exp' },
  { value: 'mistral', label: 'Mistral AI', defaultModel: 'mistral-large-latest' },
  { value: 'groq', label: 'Groq', defaultModel: 'llama-3.3-70b-versatile' },
  { value: 'deepseek', label: 'DeepSeek', defaultModel: 'deepseek-chat' },
  { value: 'cohere', label: 'Cohere', defaultModel: 'command-r-plus' },
  { value: 'perplexity', label: 'Perplexity', defaultModel: 'sonar-pro' },
] as const;

interface ProviderWithCredentials extends Omit<AIProviderSettings, '_id'> {
  _id: string;
  hasCredentials: boolean;
}

export default function AIProvidersClient() {
  const [providers, setProviders] = useState<ProviderWithCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [formData, setFormData] = useState<Partial<AIProviderSettings>>({
    provider: 'openai',
    name: '',
    apiKey: '',
    defaultModel: 'gpt-4o',
    isEnabled: true,
    isDefault: false,
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/ai-providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (error) {
      toast.error('Failed to load AI providers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saving) return; // Prevent duplicate submissions
    
    if (!formData.name || !formData.defaultModel) {
      toast.error('Please fill in all required fields');
      return;
    }

    // API key is required for new providers only
    if (editingId === 'new' && !formData.apiKey) {
      toast.error('API key is required for new providers');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save provider');
      }

      toast.success(editingId === 'new' ? 'Provider added successfully' : 'Provider updated successfully');
      setEditingId(null);
      setFormData({
        provider: 'openai',
        name: '',
        apiKey: '',
        defaultModel: 'gpt-4o',
        isEnabled: true,
        isDefault: false,
      });
      await fetchProviders();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save provider');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (provider: ProviderWithCredentials) => {
    setEditingId(provider._id);
    setFormData({
      _id: provider._id,
      provider: provider.provider,
      name: provider.name,
      apiKey: provider.apiKey || '',
      baseUrl: provider.baseUrl,
      defaultModel: provider.defaultModel,
      isEnabled: provider.isEnabled,
      isDefault: provider.isDefault,
      config: provider.config,
    });
  };

  const handleDelete = async (id: string) => {
    if (deleting) return; // Prevent multiple delete operations
    if (!confirm('Are you sure you want to delete this provider?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/ai-providers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete provider');
      }

      toast.success('Provider deleted successfully');
      await fetchProviders();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete provider');
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      provider: 'openai',
      name: '',
      apiKey: '',
      defaultModel: 'gpt-4o',
      isEnabled: true,
      isDefault: false,
    });
  };

  const getProviderLabel = (value: string) => {
    return PROVIDER_OPTIONS.find(p => p.value === value)?.label || value;
  };

  if (loading) {
    return <div className="text-center py-12">Loading providers...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add New Provider Button */}
      {editingId !== 'new' && (
        <Button onClick={() => setEditingId('new')} className="mb-4">
          <Plus className="w-4 h-4 mr-2" />
          Add New Provider
        </Button>
      )}

      {/* New Provider Form */}
      {editingId === 'new' && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle>Add New AI Provider</CardTitle>
            <CardDescription>Configure a new AI provider for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider *</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value: AIProviderSettings['provider']) => {
                      const provider = PROVIDER_OPTIONS.find(p => p.value === value);
                      setFormData({
                        ...formData,
                        provider: value,
                        defaultModel: provider?.defaultModel || '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_OPTIONS.map(provider => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Production OpenAI"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Enter API key (stored in plain text)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultModel">Default Model *</Label>
                  <Input
                    id="defaultModel"
                    value={formData.defaultModel}
                    onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                    placeholder="e.g., gpt-4o"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL (Optional)</Label>
                  <Input
                    id="baseUrl"
                    value={formData.baseUrl || ''}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="Custom endpoint URL"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isEnabled"
                    checked={formData.isEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                  />
                  <Label htmlFor="isEnabled">Enabled</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  />
                  <Label htmlFor="isDefault">Set as Default</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={saving}>
                  <Check className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Provider'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Providers */}
      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider._id} className={provider.isDefault ? 'border-amber-500' : ''}>
            {editingId === provider._id ? (
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`provider-${provider._id}`}>Provider *</Label>
                      <Select
                        value={formData.provider}
                        onValueChange={(value: AIProviderSettings['provider']) => {
                          const providerOption = PROVIDER_OPTIONS.find(p => p.value === value);
                          setFormData({
                            ...formData,
                            provider: value,
                            defaultModel: providerOption?.defaultModel || '',
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDER_OPTIONS.map(providerOption => (
                            <SelectItem key={providerOption.value} value={providerOption.value}>
                              {providerOption.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`name-${provider._id}`}>Name *</Label>
                      <Input
                        id={`name-${provider._id}`}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`apiKey-${provider._id}`}>API Key *</Label>
                    <Input
                      id={`apiKey-${provider._id}`}
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      placeholder="Enter new API key or leave unchanged"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`defaultModel-${provider._id}`}>Default Model *</Label>
                      <Input
                        id={`defaultModel-${provider._id}`}
                        value={formData.defaultModel}
                        onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`baseUrl-${provider._id}`}>Base URL (Optional)</Label>
                      <Input
                        id={`baseUrl-${provider._id}`}
                        value={formData.baseUrl || ''}
                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`isEnabled-${provider._id}`}
                        checked={formData.isEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                      />
                      <Label htmlFor={`isEnabled-${provider._id}`}>Enabled</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`isDefault-${provider._id}`}
                        checked={formData.isDefault}
                        onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                      />
                      <Label htmlFor={`isDefault-${provider._id}`}>Set as Default</Label>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={saving}>
                      <Check className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {provider.name}
                        {provider.isDefault && (
                          <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded">DEFAULT</span>
                        )}
                        {!provider.isEnabled && (
                          <span className="text-xs bg-slate-500 text-white px-2 py-1 rounded">DISABLED</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {getProviderLabel(provider.provider)} • Model: {provider.defaultModel}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(provider)} disabled={deleting === provider._id}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(provider._id)}
                        disabled={provider.isDefault || deleting === provider._id}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        {deleting === provider._id && <span className="ml-2">Deleting...</span>}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {provider.baseUrl && (
                      <div>
                        <span className="font-medium">Base URL:</span>{' '}
                        <span className="text-slate-600 dark:text-slate-400">{provider.baseUrl}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">API Key:</span>{' '}
                      <span className="text-slate-600 dark:text-slate-400">
                        {provider.hasCredentials ? '••••••••' : 'Not configured'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}

        {providers.length === 0 && editingId !== 'new' && (
          <Card>
            <CardContent className="py-12 text-center text-slate-600 dark:text-slate-400">
              No AI providers configured. Click &quot;Add New Provider&quot; to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
