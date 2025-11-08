import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb, Collections } from "@/lib/db";
import { BarChart3, Activity, TrendingUp, Clock } from "lucide-react";

export default async function APIUsagePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // @ts-expect-error - role will be added to session
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Get API usage stats
  const db = await getDb();
  const usageRecords = await db
    .collection(Collections.API_USAGE)
    .find({})
    .sort({ timestamp: -1 })
    .limit(100)
    .toArray();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayUsage = usageRecords.filter(r => 
    new Date(r.timestamp).getTime() >= today.getTime()
  );

  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  
  const weekUsage = usageRecords.filter(r => 
    new Date(r.timestamp).getTime() >= thisWeek.getTime()
  );

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#37322F] font-serif">API Usage Monitor</h1>
          <p className="text-[#605A57] mt-2">
            Track RocketReach API usage and monitor system activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{todayUsage.length}</div>
              <p className="text-xs text-[#605A57] mt-1">API calls</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                This Week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{weekUsage.length}</div>
              <p className="text-xs text-[#605A57] mt-1">API calls</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                All Time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{usageRecords.length}</div>
              <p className="text-xs text-[#605A57] mt-1">Total calls</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Success Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">
                {usageRecords.length > 0
                  ? Math.round(
                      (usageRecords.filter(r => r.status === "success").length /
                        usageRecords.length) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-[#605A57] mt-1">Successful calls</p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Chart Placeholder */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F]">Usage Over Time</CardTitle>
            <CardDescription className="text-[#605A57]">
              API call volume by day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border border-[rgba(55,50,47,0.12)] rounded-lg bg-[#F7F5F3]">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-[#605A57] mx-auto mb-2" />
                <p className="text-[#605A57]">Chart visualization coming soon</p>
                <p className="text-xs text-[#605A57] mt-1">
                  Install a charting library like recharts to visualize usage data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F]">Recent API Calls</CardTitle>
            <CardDescription className="text-[#605A57]">
              Latest RocketReach API activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usageRecords.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-[#605A57] mx-auto mb-4" />
                <p className="text-[#605A57]">No API usage recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usageRecords.slice(0, 20).map((record, index) => (
                  <div
                    key={record._id?.toString() || index}
                    className="flex items-center justify-between p-3 border border-[rgba(55,50,47,0.12)] rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#37322F]">
                          {record.endpoint || "Unknown"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            record.status === "success"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.status || "unknown"}
                        </span>
                      </div>
                      <p className="text-xs text-[#605A57] mt-1">
                        User: {record.userId || "System"} • Org: {record.orgId || "default"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#605A57]">
                        {new Date(record.timestamp).toLocaleString()}
                      </p>
                      {record.duration && (
                        <p className="text-xs text-[#605A57] mt-1">
                          {record.duration}ms
                        </p>
                      )}
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
