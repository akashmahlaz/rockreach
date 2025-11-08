import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getDb, Collections } from "@/lib/db";
import { Building2, Plus, Users, Search } from "lucide-react";

interface Organization {
  _id?: unknown;
  name: string;
  domain?: string;
  plan: string;
  status: string;
  userCount: number;
  apiQuota: number;
  createdAt: Date;
}

export default async function OrganizationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // @ts-expect-error - role will be added to session
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Get organizations from database
  const db = await getDb();
  const orgs = await db
    .collection<Organization>(Collections.ORGANIZATIONS)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const activeOrgs = orgs.filter(o => o.status === "active");
  const totalUsers = orgs.reduce((sum, org) => sum + (org.userCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Organizations</h1>
            <p className="text-[#605A57] mt-2">
              Manage multi-tenant organizations and their settings
            </p>
          </div>
          <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Organization
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{orgs.length}</div>
              <p className="text-xs text-[#605A57] mt-1">Registered orgs</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{activeOrgs.length}</div>
              <p className="text-xs text-[#605A57] mt-1">Active organizations</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{totalUsers}</div>
              <p className="text-xs text-[#605A57] mt-1">Across all orgs</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Avg Users/Org
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">
                {orgs.length > 0 ? Math.round(totalUsers / orgs.length) : 0}
              </div>
              <p className="text-xs text-[#605A57] mt-1">Average size</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search organizations..."
                className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
              />
            </div>
            <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Organizations List */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F] flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              All Organizations
            </CardTitle>
            <CardDescription className="text-[#605A57]">
              Manage organization settings, quotas, and users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orgs.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-[#605A57] mx-auto mb-4" />
                <p className="text-[#605A57] mb-2">No organizations yet</p>
                <p className="text-xs text-[#605A57] mb-4">
                  Create your first organization to start managing multi-tenant access
                </p>
                <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organization
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orgs.map((org) => (
                  <div
                    key={org._id?.toString()}
                    className="p-4 border border-[rgba(55,50,47,0.12)] rounded-lg hover:bg-[#F7F5F3] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-[#605A57]" />
                          <h3 className="text-lg font-semibold text-[#37322F]">{org.name}</h3>
                          <Badge
                            className={
                              org.status === "active"
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : "bg-[rgba(55,50,47,0.08)] text-[#37322F] hover:bg-[rgba(55,50,47,0.08)]"
                            }
                          >
                            {org.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-[rgba(55,50,47,0.12)] text-[#37322F]"
                          >
                            {org.plan || "Free"}
                          </Badge>
                        </div>
                        {org.domain && (
                          <p className="text-sm text-[#605A57] mb-2">{org.domain}</p>
                        )}
                        <div className="flex gap-6 text-sm text-[#605A57]">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{org.userCount || 0} users</span>
                          </div>
                          <div>
                            <span>API Quota: {org.apiQuota || 0}/day</span>
                          </div>
                          <div>
                            <span>
                              Created: {new Date(org.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#605A57] hover:bg-[rgba(55,50,47,0.08)]"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
