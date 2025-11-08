'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, Loader2, Save, Mail, Phone, Linkedin, Building2 } from 'lucide-react';

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
}

export default function LeadsSearchPage() {
  const [query, setQuery] = useState({ name: '', title: '', company: '', domain: '', location: '' });
  const [results, setResults] = useState<LeadResult[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
        const leads = json.data?.profiles || json.data?.data || [];
        setResults(leads);
        toast.success(`Found ${leads.length} lead(s)`);
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

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Lead Search</h1>
          <p className="text-[#605A57] mt-2">Find and save leads from RocketReach</p>
        </div>

        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-[#37322F]">Search Criteria</CardTitle>
            <CardDescription className="text-[#605A57]">Enter search parameters to find leads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#37322F]">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={query.name}
                  onChange={(e) => setQuery({ ...query, name: e.target.value })}
                  className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-[#37322F]">Title</Label>
                <Input
                  id="title"
                  placeholder="CEO"
                  value={query.title}
                  onChange={(e) => setQuery({ ...query, title: e.target.value })}
                  className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-[#37322F]">Company</Label>
                <Input
                  id="company"
                  placeholder="Acme Inc"
                  value={query.company}
                  onChange={(e) => setQuery({ ...query, company: e.target.value })}
                  className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain" className="text-[#37322F]">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={query.domain}
                  onChange={(e) => setQuery({ ...query, domain: e.target.value })}
                  className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-[#37322F]">Location</Label>
                <Input
                  id="location"
                  placeholder="New York, NY"
                  value={query.location}
                  onChange={(e) => setQuery({ ...query, location: e.target.value })}
                  className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#37322F] text-white hover:bg-[#37322F]/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#37322F]">Results ({results.length})</CardTitle>
                  <CardDescription className="text-[#605A57]">
                    {selectedCount > 0 ? `${selectedCount} lead(s) selected` : 'Select leads to save'}
                  </CardDescription>
                </div>
                {selectedCount > 0 && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="default"
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
                        Save Selected
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-[rgba(55,50,47,0.12)]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-[rgba(55,50,47,0.12)]">
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="text-[#37322F]">Name</TableHead>
                      <TableHead className="text-[#37322F]">Title</TableHead>
                      <TableHead className="text-[#37322F]">Company</TableHead>
                      <TableHead className="text-[#37322F]">Contact</TableHead>
                      <TableHead className="text-[#37322F]">Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((lead) => (
                      <TableRow key={lead.id} className="border-b border-[rgba(55,50,47,0.06)]">
                        <TableCell>
                          <Checkbox
                            checked={!!selected[lead.id]}
                            onCheckedChange={(v) =>
                              setSelected((s) => ({ ...s, [lead.id]: !!v }))
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium text-[#37322F]">{lead.name}</TableCell>
                        <TableCell className="text-[#605A57]">
                          {lead.current_title || lead.title || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-[#605A57]" />
                            <span className="text-[#605A57]">
                              {lead.current_employer || lead.company || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {lead.emails && lead.emails.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-[#605A57]" />
                                <span className="text-xs text-[#605A57]">{lead.emails[0]}</span>
                              </div>
                            )}
                            {lead.phones && lead.phones.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-[#605A57]" />
                                <span className="text-xs text-[#605A57]">{lead.phones[0]}</span>
                              </div>
                            )}
                            {lead.linkedin_url && (
                              <a
                                href={lead.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[#37322F] hover:text-[#37322F]/80"
                              >
                                <Linkedin className="h-3 w-3" />
                                <span className="text-xs">LinkedIn</span>
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[#605A57] text-sm">
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
