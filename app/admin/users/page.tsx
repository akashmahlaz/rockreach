import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getDb } from "@/lib/db";
import { Users, Search, Crown, User } from "lucide-react";
import Image from "next/image";

interface DbUser {
  _id?: unknown;
  email: string;
  name?: string;
  image?: string;
  role: string;
  emailVerified?: Date;
  createdAt?: Date;
}

export default async function UsersManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // @ts-expect-error - role will be added to session
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Get users from database
  const db = await getDb();
  const users = await db
    .collection<DbUser>("users")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const adminCount = users.filter(u => u.role === "admin").length;
  const userCount = users.filter(u => u.role === "user" || !u.role).length;

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#37322F] font-serif">User Management</h1>
          <p className="text-[#605A57] mt-2">
            Manage user accounts and permissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{users.length}</div>
              <p className="text-xs text-[#605A57] mt-1">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{adminCount}</div>
              <p className="text-xs text-[#605A57] mt-1">Admin users</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Regular Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{userCount}</div>
              <p className="text-xs text-[#605A57] mt-1">Standard accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search users by name or email..."
                className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]"
              />
            </div>
            <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F] flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Users
            </CardTitle>
            <CardDescription className="text-[#605A57]">
              Manage roles and permissions for all system users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-[#605A57] mx-auto mb-4" />
                <p className="text-[#605A57]">No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user._id?.toString()}
                    className="flex items-center justify-between p-4 border border-[rgba(55,50,47,0.12)] rounded-lg hover:bg-[#F7F5F3] transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-[rgba(55,50,47,0.08)] flex items-center justify-center overflow-hidden">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || user.email}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <User className="w-6 h-6 text-[#605A57]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[#37322F]">
                            {user.name || "Unnamed User"}
                          </h3>
                          {user.role === "admin" && (
                            <Badge className="bg-[#37322F] text-white hover:bg-[#37322F]/90">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#605A57]">{user.email}</p>
                        {user.createdAt && (
                          <p className="text-xs text-[#605A57] mt-1">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
                      >
                        Edit Role
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Management Info */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white mt-6">
          <CardHeader>
            <CardTitle className="text-lg text-[#37322F]">Role Management Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#605A57]">
            <p>
              <strong className="text-[#37322F]">Admin:</strong> Full system access including user management,
              settings, and all administrative functions.
            </p>
            <p>
              <strong className="text-[#37322F]">User:</strong> Standard access to lead search, saved leads,
              and personal dashboard.
            </p>
            <p className="pt-2 text-xs">
              <strong>Note:</strong> To change user roles, update the `role` field in the MongoDB users collection:
              <code className="ml-2 px-2 py-1 bg-[rgba(55,50,47,0.08)] rounded text-[#37322F]">
                db.users.updateOne({`{email: "user@example.com"}`}, {`{$set: {role: "admin"}}`})
              </code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
