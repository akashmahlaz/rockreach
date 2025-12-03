'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, Loader2, Save, Mail, Phone, Linkedin, Building2, Sparkles, Download, ArrowRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface LeadResult {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  current_title?: string;
  title?: string;
  current_employer?: string;
  company?: string;
  emails?: string[];
  phones?: string[];
  linkedin_url?: string;
  location?: string;
  email_domain?: string;
  raw?: unknown;
}

export default function LeadsSearchPage() {
  const [query, setQuery] = useState({ name: '', title: '', company: '', domain: '', location: '' });
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [results, setResults] = useState<LeadResult[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const normalizeLead = (lead: unknown, fallbackIndex?: number): LeadResult => {
    const record = (lead ?? {}) as Record<string, unknown>;

    const makeStringArray = (input: unknown, field: 'email' | 'number'): string[] => {
      if (!Array.isArray(input)) return [];
      return input
        .map((value) => {
          if (typeof value === 'string') return value;
          if (value && typeof value === 'object') {
            const keyed = value as Record<string, unknown>;
            const extracted = keyed[field];
            if (typeof extracted === 'string') return extracted;
          }
          return null;
        })
        .filter((value): value is string => Boolean(value));
    };

    const getString = (value: unknown): string | undefined =>
      typeof value === 'string' && value.trim().length > 0 ? value : undefined;

    const firstName = getString(record['first_name']);
    const lastName = getString(record['last_name']);
    const displayName =
      getString(record['name']) ||
      (firstName || lastName ? `${firstName ?? ''} ${lastName ?? ''}`.trim() : undefined) ||
      'Unknown';

    const candidateId =
      record['id'] ??
      record['rocketreach_id'] ??
      record['person_id'] ??
      record['profile_id'] ??
      record['linkedin_url'] ??
      (Array.isArray(record['emails']) ? (record['emails'] as unknown[])[0] : undefined);

    const finalId = candidateId
      ? String(candidateId)
      : `lead-${fallbackIndex ?? Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
      id: finalId,
      name: displayName,
      first_name: firstName,
      last_name: lastName,
      current_title: getString(record['current_title']) ?? getString(record['title']),
      title: getString(record['title']),
      current_employer: getString(record['current_employer']),
      company: getString(record['company']) ?? getString(record['current_employer']),
      emails: makeStringArray(record['emails'], 'email'),
      phones: makeStringArray(record['phones'], 'number'),
      linkedin_url: getString(record['linkedin_url']),
      location: getString(record['location']),
      email_domain: getString(record['email_domain']),
      raw: record,
    };
  };

  async function handleSearch() {
    setLoading(true);
    setResults([]);
    setSelected({});

    try {
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });
      
      const json = await res.json();
      
      if (json.ok) {
        const rawLeads: unknown[] = json.data?.profiles || json.data?.data || [];
        const normalized = rawLeads.map((lead, index: number) => normalizeLead(lead, index));
        setResults(normalized);
        toast.success(`Found ${normalized.length} lead(s)`);
      } else {
        toast.error(json.error || 'Search failed');
      }
    } catch (error) {
      toast.error('Search failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const selectedLeads = results.filter((r) => selected[r.id]);
    
    if (selectedLeads.length === 0) {
      toast.error('No leads selected');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: selectedLeads }),
      });
      
      const json = await res.json();
      
      if (json.ok) {
        toast.success(json.message || 'Leads saved successfully');
        setSelected({});
      } else {
        toast.error(json.error || 'Failed to save leads');
      }
    } catch (error) {
      toast.error('Failed to save leads');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleLinkedInLookup() {
    const trimmedInput = linkedinUrl.trim();

    if (!trimmedInput) {
      toast.error('Please enter at least one LinkedIn URL');
      return;
    }

    const urls = Array.from(
      new Set(
        trimmedInput
          .split(/[\s,;]+/)
          .map((url) => url.trim())
          .filter(Boolean)
      )
    );

    if (urls.length === 0) {
      toast.error('No valid LinkedIn URLs detected');
      return;
    }

    setLookingUp(true);

    const foundLeads: LeadResult[] = [];
    const failed: Array<{ url: string; reason: string }> = [];

    try {
      for (const url of urls) {
        try {
          const res = await fetch('/api/leads/lookup-linkedin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkedinUrl: url }),
          });

          const json = await res.json();

          if (json.ok && json.data) {
            foundLeads.push(normalizeLead(json.data));
          } else {
            failed.push({ url, reason: json.error || 'Lookup failed' });
          }
        } catch (error) {
          console.error('Lookup failed for URL:', url, error);
          failed.push({ url, reason: 'Network error' });
        }
      }

      if (foundLeads.length > 0) {
        setResults((prev) => {
          const deduped = new Map<string, LeadResult>();

          const allLeads = [...prev, ...foundLeads];
          allLeads.forEach((lead) => {
            deduped.set(lead.id, lead);
          });

          return Array.from(deduped.values());
        });

        toast.success(`Saved ${foundLeads.length} profile${foundLeads.length === 1 ? '' : 's'}`);
        setLinkedinUrl('');
      }

      if (failed.length > 0) {
        failed.slice(0, 3).forEach(({ url, reason }) => {
          toast.error(`${url}: ${reason}`);
        });

        if (failed.length > 3) {
          toast.error(`${failed.length - 3} additional lookups failed`);
        }
      }
    } finally {
      setLookingUp(false);
    }
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Lead Search</h1>
            </div>
            <p className="text-muted-foreground ml-12">Find decision makers with verified contact information</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/c">
                <Sparkles className="w-4 h-4" />
                Use AI Instead
              </Link>
            </Button>
          </div>
        </div>

        {/* AI Suggestion Banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Want faster results?</p>
                  <p className="text-sm text-muted-foreground">Just tell our AI what leads you need - it's much easier!</p>
                </div>
              </div>
              <Button asChild size="sm" className="gap-2">
                <Link href="/c">
                  Try AI Search
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Search Criteria
            </CardTitle>
            <CardDescription>Enter search parameters to find leads with emails and phone numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* LinkedIn URL Lookup */}
            <div className="p-5 border border-blue-200 dark:border-blue-900 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
              <div className="flex items-center gap-2 mb-3">
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                <Label className="text-foreground font-semibold">LinkedIn URL Lookup</Label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Paste one or more LinkedIn profile URLs (separate with commas or new lines) to enrich and save contacts.
              </p>
              <div className="flex flex-col md:flex-row gap-3">
                <Textarea
                  placeholder={"https://linkedin.com/in/profile-name\nhttps://linkedin.com/in/another-profile"}
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="flex-1 bg-background border-border"
                  rows={4}
                />
                <Button
                  onClick={handleLinkedInLookup}
                  disabled={lookingUp}
                  className="md:w-auto w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white"
                >
                  {lookingUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Linkedin className="mr-2 h-4 w-4" />
                      Lookup
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or search by criteria</span>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={query.name}
                  onChange={(e) => setQuery({ ...query, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="CEO, CTO, VP..."
                  value={query.title}
                  onChange={(e) => setQuery({ ...query, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Acme Inc"
                  value={query.company}
                  onChange={(e) => setQuery({ ...query, company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={query.domain}
                  onChange={(e) => setQuery({ ...query, domain: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="New York, NY"
                  value={query.location}
                  onChange={(e) => setQuery({ ...query, location: e.target.value })}
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading}
              size="lg"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search Leads
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Found {results.length} Leads
                  </CardTitle>
                  <CardDescription>
                    {selectedCount > 0 ? `${selectedCount} lead(s) selected` : 'Select leads to save to your database'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedCount > 0 && (
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save {selectedCount} Lead{selectedCount > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Title</TableHead>
                      <TableHead className="font-semibold">Company</TableHead>
                      <TableHead className="font-semibold">📧 Email</TableHead>
                      <TableHead className="font-semibold">📱 Phone</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell>
                          <Checkbox
                            checked={!!selected[lead.id]}
                            onCheckedChange={(v) =>
                              setSelected((s) => ({ ...s, [lead.id]: !!v }))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{lead.name}</div>
                          {lead.linkedin_url && (
                            <a
                              href={lead.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                            >
                              <Linkedin className="h-3 w-3" />
                              Profile
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {lead.current_title || lead.title || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.current_employer || lead.company || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.emails && lead.emails.length > 0 ? (
                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">{lead.emails[0]}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.phones && lead.phones.length > 0 ? (
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                              <Phone className="h-4 w-4" />
                              <span className="text-sm">{lead.phones[0]}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {lead.location || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
