import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Check if user is admin
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <>
      <NavbarWrapper />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              System administration and configuration
            </p>
          </div>

        {/* Admin Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">API Settings</CardTitle>
              <CardDescription className="text-[#605A57]">
                Configure API keys and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-[#37322F] hover:bg-[#37322F]/90 text-white">
                <Link href="/admin/settings">Manage Settings</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">User Management</CardTitle>
              <CardDescription className="text-[#605A57]">
                Manage users and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]">
                <Link href="/admin/users">View Users</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">Audit Logs</CardTitle>
              <CardDescription className="text-[#605A57]">
                View system activity logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]">
                <Link href="/admin/audit-logs">View Logs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">API Usage</CardTitle>
              <CardDescription className="text-[#605A57]">
                Monitor API usage and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]">
                <Link href="/admin/api-usage">View Usage</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">Organizations</CardTitle>
              <CardDescription className="text-[#605A57]">
                Manage organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]">
                <Link href="/admin/organizations">View Orgs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">System Stats</CardTitle>
              <CardDescription className="text-[#605A57]">
                View overall system statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]">
                <Link href="/admin/stats">View Stats</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">AI Providers</CardTitle>
              <CardDescription className="text-[#605A57]">
                Manage AI Providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]">
                <Link href="/admin/ai-providers">View AI Providers</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">0</div>
              <p className="text-xs text-[#605A57] mt-1">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">0</div>
              <p className="text-xs text-[#605A57] mt-1">System-wide</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                API Calls Today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">0</div>
              <p className="text-xs text-[#605A57] mt-1">Lead Gen API</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">0</div>
              <p className="text-xs text-[#605A57] mt-1">Active orgs</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Admin Activity */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F]">Recent Admin Activity</CardTitle>
            <CardDescription className="text-[#605A57]">
              Latest configuration changes and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
