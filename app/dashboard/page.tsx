import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Redirect admins to admin dashboard
  // @ts-expect-error - role will be added to session
  if (session.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#37322F] font-serif">My Dashboard</h1>
          <p className="text-[#605A57] mt-2">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">Search Leads</CardTitle>
              <CardDescription className="text-[#605A57]">
                Find prospects using RocketReach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-[#37322F] hover:bg-[#37322F]/90 text-white">
                <Link href="/leads/search">Start Search</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">My Leads</CardTitle>
              <CardDescription className="text-[#605A57]">
                View and manage your saved leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]">
                <Link href="/leads">View Leads</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#37322F]">Lead Lists</CardTitle>
              <CardDescription className="text-[#605A57]">
                Organize leads into lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]">
                <Link href="/leads/lists">Manage Lists</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">0</div>
              <p className="text-xs text-[#605A57] mt-1">Leads saved</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">0</div>
              <p className="text-xs text-[#605A57] mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                API Usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">0</div>
              <p className="text-xs text-[#605A57] mt-1">Calls today</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Active Lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">0</div>
              <p className="text-xs text-[#605A57] mt-1">Lead lists</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F]">Recent Activity</CardTitle>
            <CardDescription className="text-[#605A57]">
              Your latest searches and saved leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-[#605A57]">
              <p>No recent activity</p>
              <Button asChild variant="link" className="mt-2 text-[#37322F]">
                <Link href="/leads/search">Start searching for leads</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
