import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDb, Collections } from "@/lib/db";
import { FileText, Filter, Search } from "lucide-react";

export default async function AuditLogsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // @ts-expect-error - role will be added to session
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Get audit logs
  const db = await getDb();
  const logs = await db
    .collection(Collections.AUDIT_LOGS)
    .find({})
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Audit Logs</h1>
          <p className="text-[#605A57] mt-2">
            System activity and security audit trail
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search logs..."
              className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
            />
          </div>
          <Button
            variant="outline"
            className="border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{logs.length}</div>
              <p className="text-xs text-[#605A57] mt-1">Recorded events</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">
                {logs.filter(l => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return new Date(l.timestamp).getTime() >= today.getTime();
                }).length}
              </div>
              <p className="text-xs text-[#605A57] mt-1">Events today</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                This Week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">
                {logs.filter(l => {
                  const week = new Date();
                  week.setDate(week.getDate() - 7);
                  return new Date(l.timestamp).getTime() >= week.getTime();
                }).length}
              </div>
              <p className="text-xs text-[#605A57] mt-1">Events this week</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Critical Events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">
                {logs.filter(l => l.severity === "critical" || l.severity === "error").length}
              </div>
              <p className="text-xs text-[#605A57] mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F] flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Activity Log
            </CardTitle>
            <CardDescription className="text-[#605A57]">
              Detailed system activity and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-[#605A57] mx-auto mb-4" />
                <p className="text-[#605A57]">No audit logs recorded yet</p>
                <p className="text-xs text-[#605A57] mt-2">
                  System events will appear here as they occur
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={log._id?.toString() || index}
                    className="p-4 border border-[rgba(55,50,47,0.12)] rounded-lg hover:bg-[#F7F5F3] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-[#37322F]">
                            {log.action || "Unknown Action"}
                          </span>
                          <Badge
                            variant={
                              log.severity === "critical"
                                ? "destructive"
                                : log.severity === "warning"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              log.severity === "critical"
                                ? "bg-red-100 text-red-700 hover:bg-red-100"
                                : log.severity === "warning"
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                                : "bg-[rgba(55,50,47,0.08)] text-[#37322F] hover:bg-[rgba(55,50,47,0.08)]"
                            }
                          >
                            {log.severity || "info"}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#605A57] mb-2">
                          {log.description || "No description available"}
                        </p>
                        <div className="flex gap-4 text-xs text-[#605A57]">
                          <span>User: {log.userId || "System"}</span>
                          <span>•</span>
                          <span>Org: {log.orgId || "default"}</span>
                          {log.ipAddress && (
                            <>
                              <span>•</span>
                              <span>IP: {log.ipAddress}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-[#605A57] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
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
