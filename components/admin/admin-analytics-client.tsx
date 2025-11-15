"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DollarSign,
  Users,
  Zap,
  MessageSquare,
  Search,
  Loader2,
  RefreshCw,
  Settings,
} from "lucide-react";

interface AnalyticsData {
  period: string;
  summary: {
    totalUsers: number;
    totalAICost: number;
    totalAITokens: number;
    totalAICalls: number;
    totalRocketReachCalls: number;
    totalConversations: number;
    totalMessages: number;
  };
  aiUsageByUser: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalTokens: number;
    totalCalls: number;
    successCalls: number;
    errorCalls: number;
    avgDurationMs: number;
    estimatedCost: number;
  }>;
  rocketReachUsageByUser: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalCalls: number;
    searchCalls: number;
    lookupCalls: number;
    successCalls: number;
  }>;
  conversationStatsByUser: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalConversations: number;
    totalMessages: number;
  }>;
}

export function AdminAnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("30d");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Analytics</h1>
          <p className="text-slate-600 mt-1">Monitor AI and API usage across your organization</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => window.location.href = "/admin/users"} 
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button 
            onClick={() => window.location.href = "/admin/ai-providers"} 
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            AI Providers
          </Button>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "24h" | "7d" | "30d")}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <Button onClick={fetchAnalytics} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AI Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${data.summary.totalAICost.toFixed(2)}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {data.summary.totalAICalls.toLocaleString()} total calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Tokens</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(data.summary.totalAITokens / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {data.summary.totalUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RocketReach Calls</CardTitle>
            <Search className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.summary.totalRocketReachCalls}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              API requests made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.summary.totalConversations}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {data.summary.totalMessages} total messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Usage by User */}
      <Card>
        <CardHeader>
          <CardTitle>AI Usage by User</CardTitle>
          <CardDescription>Token usage and cost breakdown per user</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
                  <TableHead className="text-right">Avg Duration</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.aiUsageByUser.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-xs text-slate-500">{user.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {user.totalTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{user.totalCalls}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={user.successCalls === user.totalCalls ? "default" : "secondary"}>
                        {Math.round((user.successCalls / user.totalCalls) * 100)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {user.avgDurationMs}ms
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-600">
                      ${user.estimatedCost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* RocketReach Usage by User */}
      <Card>
        <CardHeader>
          <CardTitle>RocketReach Usage by User</CardTitle>
          <CardDescription>API calls breakdown per user</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">Search</TableHead>
                  <TableHead className="text-right">Lookup</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rocketReachUsageByUser.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-xs text-slate-500">{user.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {user.totalCalls}
                    </TableCell>
                    <TableCell className="text-right">{user.searchCalls}</TableCell>
                    <TableCell className="text-right">{user.lookupCalls}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={user.successCalls === user.totalCalls ? "default" : "secondary"}>
                        {Math.round((user.successCalls / user.totalCalls) * 100)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversation Stats by User */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Activity by User</CardTitle>
          <CardDescription>Chat usage and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Conversations</TableHead>
                  <TableHead className="text-right">Total Messages</TableHead>
                  <TableHead className="text-right">Avg Messages/Chat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.conversationStatsByUser.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-xs text-slate-500">{user.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{user.totalConversations}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {user.totalMessages}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {(user.totalMessages / user.totalConversations).toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
