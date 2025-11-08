"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Users as UsersIcon, Crown, Search, User as UserIcon, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface AdminUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: "admin" | "user"
  createdAt?: string | null
  orgId?: string | null
  orgName?: string | null
}

interface OrganizationOption {
  id: string
  name: string
  slug?: string | null
}

interface AdminUsersClientProps {
  users: AdminUser[]
  organizations: OrganizationOption[]
}

export default function AdminUsersClient({ users, organizations }: AdminUsersClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [roleValue, setRoleValue] = useState<"admin" | "user">("user")
  const [orgValue, setOrgValue] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  const activeUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [users, selectedUserId])

  useEffect(() => {
    if (!activeUser) {
      setRoleValue("user")
      setOrgValue("")
      return
    }

    setRoleValue(activeUser.role)
    setOrgValue(activeUser.orgId ?? "")
  }, [activeUser])

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return users
    }

    return users.filter((user) => {
      const name = user.name?.toLowerCase() ?? ""
      const email = user.email.toLowerCase()
      const orgName = user.orgName?.toLowerCase() ?? ""

      return name.includes(query) || email.includes(query) || orgName.includes(query)
    })
  }, [searchTerm, users])

  const handleEditClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsDialogOpen(true)
  }

  const handleDialogChange = (nextOpen: boolean) => {
    setIsDialogOpen(nextOpen)
    if (!nextOpen) {
      setSelectedUserId(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activeUser) {
      return
    }

    const payload: Record<string, string | null> = {}

    if (roleValue !== activeUser.role) {
      payload.role = roleValue
    }

    const normalizedOrg = orgValue.length > 0 ? orgValue : null
    const currentOrg = activeUser.orgId ?? null

    if (normalizedOrg !== currentOrg) {
      payload.orgId = normalizedOrg
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save.")
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch(`/api/admin/users/${activeUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unable to update user." }))
        toast.error(error?.error ?? "Unable to update user.")
        return
      }

      toast.success("User updated successfully.")
      handleDialogChange(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to update user", error)
      toast.error("Unexpected error occurred. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#605A57]" />
          <Input
            type="search"
            placeholder="Search users by name, email, or organization"
            className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F] pl-10"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            className="text-[#605A57] hover:bg-[rgba(55,50,47,0.08)]"
            onClick={() => setSearchTerm("")}
          >
            Clear
          </Button>
        )}
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-[#605A57] mx-auto mb-4" />
          <p className="text-[#605A57]">No users found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
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
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-[#605A57]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-[#37322F]">
                      {user.name || "Unnamed User"}
                    </h3>
                    {user.role === "admin" && (
                      <Badge className="bg-[#37322F] text-white hover:bg-[#37322F]/90">
                        <Crown className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {user.orgName && (
                      <Badge variant="outline" className="border-[rgba(55,50,47,0.12)] text-[#37322F]">
                        {user.orgName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#605A57]">{user.email}</p>
                  <p className="text-xs text-[#605A57] mt-1">
                    {user.createdAt
                      ? `Joined ${new Date(user.createdAt).toLocaleDateString()}`
                      : "Signup date unavailable"}
                  </p>
                  {!user.orgName && (
                    <p className="text-xs text-[#9b9490] mt-1">No organization assigned</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
                  onClick={() => handleEditClick(user.id)}
                >
                  Edit Role
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="bg-white border-[rgba(55,50,47,0.12)]">
          <DialogHeader>
            <DialogTitle className="text-[#37322F]">Update user access</DialogTitle>
            <DialogDescription className="text-[#605A57]">
              Choose a role and optional organization for this user.
            </DialogDescription>
          </DialogHeader>

          {activeUser ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={roleValue}
                  onValueChange={(nextValue) => setRoleValue(nextValue as "admin" | "user")}
                >
                  <SelectTrigger className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Organization</Label>
                <Select value={orgValue} onValueChange={setOrgValue}>
                  <SelectTrigger className="bg-white border-[rgba(55,50,47,0.12)] text-[#37322F]">
                    <SelectValue placeholder="Assign an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
                  onClick={() => handleDialogChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#37322F] hover:bg-[#37322F]/90 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving
                    </span>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <p className="text-sm text-[#605A57]">Select a user to edit their access.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
