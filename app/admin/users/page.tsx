import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb, Collections } from "@/lib/db";
import { Users } from "lucide-react";
import { ObjectId } from "mongodb";
import AdminUsersClient from "@/components/admin/admin-users-client";

interface DbUser {
  _id?: unknown;
  email: string;
  name?: string;
  image?: string;
  role: string;
  emailVerified?: Date;
  createdAt?: Date;
  orgId?: unknown;
}

interface DbOrganization {
  _id?: unknown;
  name: string;
  slug?: string;
}

function toStringId(value: unknown) {
  if (value instanceof ObjectId) {
    return value.toHexString();
  }

  if (typeof value === "object" && value !== null && "toString" in value) {
    try {
      return String((value as { toString: () => string }).toString());
    } catch (error) {
      console.error("Unable to coerce id", error);
    }
  }

  return value ? String(value) : "";
}

export default async function UsersManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Get users from database
  const db = await getDb();
  const users = await db
    .collection<DbUser>(Collections.USERS)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const organizations = await db
    .collection<DbOrganization>(Collections.ORGANIZATIONS)
    .find({})
    .project({ name: 1, slug: 1 })
    .toArray();

  const organizationLookup = new Map(
    organizations.map((org) => [toStringId(org._id), { id: toStringId(org._id), name: org.name, slug: org.slug }])
  );

  const serializedUsers = users.map((user) => {
    const orgId = user.orgId ? toStringId(user.orgId) : "";
    const organization = orgId ? organizationLookup.get(orgId) : undefined;

    return {
      id: toStringId(user._id),
      email: user.email,
      name: user.name ?? null,
      image: user.image ?? null,
      role: (user.role as "admin" | "user") ?? "user",
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      orgId: orgId || null,
      orgName: organization?.name ?? null,
    };
  });

  const serializedOrganizations = organizations.map((org) => ({
    id: toStringId(org._id),
    name: org.name,
    slug: org.slug ?? null,
  }));

  const adminCount = serializedUsers.filter((u) => u.role === "admin").length;
  const userCount = serializedUsers.filter((u) => u.role === "user" || !u.role).length;

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
            <AdminUsersClient users={serializedUsers} organizations={serializedOrganizations} />
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
            <p>
              Use the <em>Edit Role</em> action above to promote collaborators or assign them to an organization.
              Every workspace should keep at least one admin available for emergency access.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
