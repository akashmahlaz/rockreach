import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getDb, Collections } from "@/lib/db";

interface Lead {
  _id?: unknown;
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

  // Get leads from database
  const db = await getDb();
  const leads = await db
    .collection<Lead>(Collections.LEADS)
    .find({ orgId: "default" })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#37322F] font-serif">My Leads</h1>
          <p className="text-[#605A57] mt-2">
            Manage and organize your saved prospects
          </p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Search leads..."
              className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F] placeholder:text-[rgba(55,50,47,0.60)]"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-white"
            >
              Export
            </Button>
            <Button asChild className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
              <Link href="/leads/search">Search New Leads</Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{leads.length}</div>
              <p className="text-xs text-[#605A57] mt-1">Saved contacts</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                With Email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">
                {leads.filter((l) => l.emails && l.emails.length > 0).length}
              </div>
              <p className="text-xs text-[#605A57] mt-1">Email contacts</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                With Phone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">
                {leads.filter((l) => l.phones && l.phones.length > 0).length}
              </div>
              <p className="text-xs text-[#605A57] mt-1">Phone contacts</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                In Lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">0</div>
              <p className="text-xs text-[#605A57] mt-1">Organized</p>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F]">All Leads</CardTitle>
            <CardDescription className="text-[#605A57]">
              Your saved prospects and contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#605A57] mb-4">No leads saved yet</p>
                <Button asChild className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
                  <Link href="/leads/search">Search for Leads</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(55,50,47,0.12)]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#37322F]">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#37322F]">
                        Title
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#37322F]">
                        Company
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#37322F]">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#37322F]">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#37322F]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, index: number) => (
                      <tr
                        key={lead._id?.toString() || index}
                        className="border-b border-[rgba(55,50,47,0.06)] hover:bg-[#F7F5F3] transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-[#37322F] font-medium">
                          {lead.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#605A57]">
                          {lead.title || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#605A57]">
                          {lead.company || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#605A57]">
                          {lead.emails?.[0] || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#605A57]">
                          {lead.phones?.[0] || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#37322F] hover:bg-[rgba(55,50,47,0.08)]"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
