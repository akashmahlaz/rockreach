import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getDb, Collections } from "@/lib/db";
import { ExportLeadsButton } from "@/components/export-leads-button";
import { ImportLeadsButton } from "@/components/import-leads-button";
import type { ObjectId } from "mongodb";

interface Lead {
  _id?: ObjectId;
  name?: string;
  title?: string;
  company?: string;
  emails?: string[];
  phones?: string[];
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

  // Get leads from database
  const db = await getDb();
  const cursor = db.collection(Collections.LEADS).find({ orgId });
  const leads = (await cursor.toArray()) as Lead[];

  return (
    <>
      <NavbarWrapper />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Leads</h1>
            <p className="text-muted-foreground mt-2">
              Manage and organize your saved prospects
            </p>
          </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Search leads..."
              className="bg-background"
            />
          </div>
          <div className="flex gap-3">
            <ImportLeadsButton />
            <ExportLeadsButton />
            <Button asChild>
              <Link href="/leads/search">Search New Leads</Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium">
                Total Leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Saved contacts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium">
                With Email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads.filter((l) => l.emails && l.emails.length > 0).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email contacts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium">
                With Phone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leads.filter((l) => l.phones && l.phones.length > 0).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Phone contacts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium">
                In Lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Organized</p>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Leads</CardTitle>
            <CardDescription>
              Your saved prospects and contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No leads saved yet</p>
                <Button asChild>
                  <Link href="/leads/search">Search for Leads</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium">
                        Title
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium">
                        Company
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, index: number) => {
                      const leadId = lead._id?.toString();

                      return (
                      <tr
                        key={leadId ?? index}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium">
                          {lead.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {lead.title || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {lead.company || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {lead.emails?.[0] || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {lead.phones?.[0] || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {leadId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/leads/${leadId}`}>View</Link>
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
