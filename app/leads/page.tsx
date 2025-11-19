import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDb, Collections } from "@/lib/db";
import { getLeadStats } from "@/models/Lead";
import { ExportLeadsButton } from "@/components/export-leads-button";
import { ImportLeadsButton } from "@/components/import-leads-button";
import { LeadsTableClient } from "@/components/leads/leads-table-client";
import { Phone, Mail, Users, TrendingUp, Search, Download, Upload, Plus, Sparkles } from "lucide-react";
import type { ObjectId } from "mongodb";

interface Lead {
  _id?: ObjectId;
  name?: string;
  title?: string;
  company?: string;
  emails?: string[];
  phones?: string[];
  linkedin?: string;
  orgId: string;
  createdAt: Date;
}

export default async function MyLeadsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const orgId = session.user.orgId ?? session.user.email;

  if (!orgId) {
    redirect("/dashboard");
  }

  // Get leads from database with optimized query
  const db = await getDb();
  const leads = (await db.collection(Collections.LEADS)
    .find({ orgId })
    .sort({ createdAt: -1 }) // Newest first
    .limit(1000) // Limit for performance
    .toArray()) as Lead[];

  // Get statistics
  const stats = await getLeadStats(orgId);

  return (
    <>
      <NavbarWrapper />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Professional Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold text-foreground">My Leads</h1>
                </div>
                <p className="text-muted-foreground text-lg ml-14">
                  Manage and organize your saved prospects with powerful tools
                </p>
              </div>
              <Button asChild size="lg" className="hidden sm:flex">
                <Link href="/leads/search" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Search New Leads
                </Link>
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Cards with Icons and Gradients */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium text-muted-foreground">
                    Total Leads
                  </CardDescription>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-2">All saved contacts</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="w-4 h-4" /> With Email
                  </CardDescription>
                  <Mail className="w-5 h-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.withEmail.toLocaleString()}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${stats.emailCoverage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-green-600">{stats.emailCoverage.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="w-4 h-4" /> With Phone
                  </CardDescription>
                  <Phone className="w-5 h-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.withPhone.toLocaleString()}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${stats.phoneCoverage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-purple-600">{stats.phoneCoverage.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium text-muted-foreground">
                    Complete Profiles
                  </CardDescription>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.withBoth.toLocaleString()}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${stats.completeCoverage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-amber-600">{stats.completeCoverage.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional Actions Bar */}
          <Card className="mb-6 border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="default" size="default" className="gap-2">
                    <Link href="/leads/search">
                      <Search className="w-4 h-4" />
                      Search New Leads
                    </Link>
                  </Button>
                  <ImportLeadsButton />
                  <ExportLeadsButton />
                </div>
                <div className="text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Leads Table Card */}
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">All Leads</CardTitle>
                  <CardDescription className="mt-1">
                    Your complete database of prospects and contacts
                  </CardDescription>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{leads.length.toLocaleString()} total</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No leads saved yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start building your prospect database by searching for leads or importing a CSV file.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild size="lg">
                      <Link href="/leads/search">
                        <Search className="w-4 h-4 mr-2" />
                        Search for Leads
                      </Link>
                    </Button>
                    <ImportLeadsButton />
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <LeadsTableClient initialLeads={leads} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
