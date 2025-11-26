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
  { value: 'moonshot', label: 'Moonshot AI (Kimi)', defaultModel: 'moonshotai/kimi-k2' },
] as const;

// All available models by provider (as of Nov 2025)
const PROVIDER_MODELS: Record<string, Array<{ value: string; label: string; description: string }>> = {
  openai: [
    { value: 'gpt-5.1', label: 'GPT-5.1 (Latest - Nov 2025)', description: 'Best for complex tasks, 100+ leads' },
    { value: 'gpt-5.1-chat-latest', label: 'GPT-5.1 Chat Latest', description: 'Latest chat-optimized version' },
    { value: 'gpt-5', label: 'GPT-5', description: 'Previous generation, excellent reasoning' },
    { value: 'gpt-4o', label: 'GPT-4o (Recommended)', description: 'Fast, cost-effective, handles 100 leads well' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Faster, lower cost, good for simple tasks' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Previous generation, reliable' },
    { value: 'gpt-4', label: 'GPT-4', description: 'Older but reliable' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fastest, lowest cost' },
  ],
  anthropic: [
    { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet (Latest)', description: 'Latest Claude model, best performance' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'Excellent for complex reasoning, 100+ leads' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku', description: 'Fast and cost-effective' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', description: 'Most capable, highest cost' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', description: 'Previous generation' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: 'Fastest Claude model' },
  ],
  google: [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Latest)', description: 'Latest, fastest Gemini model' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Best for complex tasks, 100+ leads' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
    { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro', description: 'Previous generation' },
  ],
  gemini: [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Latest)', description: 'Latest, fastest Gemini model' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Best for complex tasks, 100+ leads' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
    { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro', description: 'Previous generation' },
  ],
  mistral: [
    { value: 'mistral-large-latest', label: 'Mistral Large (Latest)', description: 'Most capable Mistral model' },
    { value: 'mistral-medium-latest', label: 'Mistral Medium', description: 'Balanced performance' },
    { value: 'mistral-small-latest', label: 'Mistral Small', description: 'Fast and efficient' },
    { value: 'pixtral-12b-2409', label: 'Pixtral 12B', description: 'Multimodal model' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Latest)', description: 'Latest Llama, excellent for 100+ leads' },
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B', description: 'Previous generation' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', description: 'Fast, lower cost' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', description: 'Mixture of experts' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat', description: 'Main chat model' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder', description: 'Optimized for coding' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', description: 'Enhanced reasoning' },
  ],
  cohere: [
    { value: 'command-r-plus', label: 'Command R+', description: 'Most capable Cohere model' },
    { value: 'command-r', label: 'Command R', description: 'Balanced performance' },
    { value: 'command', label: 'Command', description: 'Previous generation' },
  ],
  perplexity: [
    { value: 'sonar-pro', label: 'Sonar Pro', description: 'Best for research and analysis' },
    { value: 'sonar', label: 'Sonar', description: 'Standard version' },
    { value: 'sonar-small', label: 'Sonar Small', description: 'Fast and efficient' },
  ],
  moonshot: [
    { value: 'moonshotai/kimi-k2', label: 'Kimi K2 (Latest)', description: 'Latest Kimi model, best for 100+ leads' },
    { value: 'moonshotai/kimi-k2-0905', label: 'Kimi K2 0905', description: 'Agentic coding, 256K context' },
    { value: 'moonshotai/kimi-k2-thinking', label: 'Kimi K2 Thinking', description: 'Deep reasoning, optimized' },
    { value: 'moonshotai/kimi-k2-thinking-turbo', label: 'Kimi K2 Thinking Turbo', description: 'Fast reasoning, low latency' },
    { value: 'moonshot-v1-8k', label: 'Moonshot v1 8K', description: 'Previous generation' },
    { value: 'moonshot-v1-32k', label: 'Moonshot v1 32K', description: 'Extended context' },
    { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K', description: 'Very long context' },
  ],
};

// Helper function to get models for a provider
const getModelsForProvider = (provider: string) => {
  return PROVIDER_MODELS[provider] || [];
};

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
                    <SelectTrigger className="w-full">
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
                  {getModelsForProvider(formData.provider || '').length > 0 ? (
                    <Select
                      value={formData.defaultModel}
                      onValueChange={(value) => setFormData({ ...formData, defaultModel: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${getProviderLabel(formData.provider || '')} model`} />
                      </SelectTrigger>
                      <SelectContent className="min-w-[300px]">
                        {getModelsForProvider(formData.provider || '').map((model) => (
                          <SelectItem key={model.value} value={model.value} className="py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-sm">{model.label}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="defaultModel"
                      value={formData.defaultModel}
                      onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                      placeholder="e.g., gpt-4o"
                      required
                    />
                  )}
                  {(formData.provider === 'openai' || formData.provider === 'anthropic' || formData.provider === 'moonshot') && (
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>For 100 leads:</strong> Use latest models (GPT-5.1, Claude 3.7, Kimi K2) - they handle large outputs best
                    </p>
                  )}
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
                        <SelectTrigger className="w-full">
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
                      {getModelsForProvider(formData.provider || '').length > 0 ? (
                        <Select
                          value={formData.defaultModel}
                          onValueChange={(value) => setFormData({ ...formData, defaultModel: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`Select ${getProviderLabel(formData.provider || '')} model`} />
                          </SelectTrigger>
                          <SelectContent className="min-w-[300px]">
                            {getModelsForProvider(formData.provider || '').map((model) => (
                              <SelectItem key={model.value} value={model.value} className="py-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium text-sm">{model.label}</span>
                                  <span className="text-xs text-muted-foreground">{model.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`defaultModel-${provider._id}`}
                          value={formData.defaultModel}
                          onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                          required
                        />
                      )}
                      {(formData.provider === 'openai' || formData.provider === 'anthropic' || formData.provider === 'moonshot') && (
                        <p className="text-xs text-muted-foreground">
                          💡 <strong>For 100 leads:</strong> Use latest models (GPT-5.1, Claude 3.7, Kimi K2) - they handle large outputs best
                        </p>
                      )}
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
