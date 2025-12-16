import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Users, Search, Mail, Phone, TrendingUp, ArrowRight, Zap } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Redirect admins to admin dashboard
  if (session.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <>
      <NavbarWrapper />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, <span className="text-primary">{session.user.name?.split(' ')[0] || 'there'}</span>!
              </h1>
            </div>
            <p className="text-muted-foreground ml-12">
              Ready to find your next customers? Let's get started.
            </p>
          </div>

          {/* Main CTA - AI Assistant */}
          <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-8 relative">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-primary/10 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">AI Lead Finder</h2>
                    <p className="text-muted-foreground max-w-md">
                      Just tell the AI what leads you need - it will find their <strong>emails</strong> and <strong>phone numbers</strong> instantly.
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 gap-2">
                  <Link href="/c">
                    Start Finding Leads
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <Search className="w-5 h-5 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">Search Leads</CardTitle>
                </div>
                <CardDescription className="ml-11">
                  Find prospects by company, title, or location
                </CardDescription>
              </CardHeader>
              <CardContent className="ml-11">
                <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Link href="/leads/search">Start Search</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">My Leads</CardTitle>
                </div>
                <CardDescription className="ml-11">
                  View and manage your saved contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="ml-11">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/leads">View All Leads</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <Mail className="w-5 h-5 text-purple-500" />
                  </div>
                  <CardTitle className="text-lg">Email Campaign</CardTitle>
                </div>
                <CardDescription className="ml-11">
                  Send emails to your leads at scale
                </CardDescription>
              </CardHeader>
              <CardContent className="ml-11">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/c">Create Campaign</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-3xl font-bold text-foreground">0</p>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-3xl font-bold text-foreground">0</p>
                    <p className="text-sm text-muted-foreground">With Emails</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Phone className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-3xl font-bold text-foreground">0</p>
                    <p className="text-sm text-muted-foreground">With Phones</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-3xl font-bold text-foreground">0</p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="py-12">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Get Started in Seconds</h3>
                <p className="text-muted-foreground mb-6">
                  Tell our AI what leads you need and watch the magic happen. No complex searches, no filters - just say what you want.
                </p>
                <Button asChild size="lg" className="gap-2">
                  <Link href="/c">
                    <Sparkles className="w-4 h-4" />
                    Try AI Lead Finder
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
