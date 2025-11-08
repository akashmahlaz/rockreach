import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { getDb, Collections } from "@/lib/db";
import { Plus, Users, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface LeadList {
  _id?: unknown;
  name: string;
  description?: string;
  orgId: string;
  leadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export default async function LeadListsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // Get lead lists from database
  const db = await getDb();
  const lists = await db
    .collection<LeadList>(Collections.LEAD_LISTS)
    .find({ orgId: "default" })
    .sort({ updatedAt: -1 })
    .toArray();

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Lead Lists</h1>
            <p className="text-[#605A57] mt-2">
              Organize your leads into custom lists and campaigns
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create List
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-[rgba(55,50,47,0.12)]">
              <DialogHeader>
                <DialogTitle className="text-[#37322F]">Create New List</DialogTitle>
                <DialogDescription className="text-[#605A57]">
                  Create a new list to organize your leads
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="list-name" className="text-[#37322F]">
                    List Name
                  </Label>
                  <Input
                    id="list-name"
                    placeholder="e.g., Q1 Prospects"
                    className="bg-white border-[rgba(55,50,47,0.12)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="list-description" className="text-[#37322F]">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="list-description"
                    placeholder="Describe the purpose of this list..."
                    className="bg-white border-[rgba(55,50,47,0.12)] min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="border-[rgba(55,50,47,0.12)] text-[#37322F]"
                >
                  Cancel
                </Button>
                <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
                  Create List
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{lists.length}</div>
              <p className="text-xs text-[#605A57] mt-1">Active lists</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Total Leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">
                {lists.reduce((sum, list) => sum + (list.leadCount || 0), 0)}
              </div>
              <p className="text-xs text-[#605A57] mt-1">Across all lists</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium">
                Average List Size
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">
                {lists.length > 0
                  ? Math.round(lists.reduce((sum, list) => sum + (list.leadCount || 0), 0) / lists.length)
                  : 0}
              </div>
              <p className="text-xs text-[#605A57] mt-1">Leads per list</p>
            </CardContent>
          </Card>
        </div>

        {/* Lists Grid */}
        {lists.length === 0 ? (
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="w-12 h-12 text-[#605A57] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#37322F] mb-2">No lists yet</h3>
                <p className="text-[#605A57] mb-4">
                  Create your first list to start organizing leads
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First List
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-[rgba(55,50,47,0.12)]">
                    <DialogHeader>
                      <DialogTitle className="text-[#37322F]">Create New List</DialogTitle>
                      <DialogDescription className="text-[#605A57]">
                        Create a new list to organize your leads
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-list-name" className="text-[#37322F]">
                          List Name
                        </Label>
                        <Input
                          id="first-list-name"
                          placeholder="e.g., Q1 Prospects"
                          className="bg-white border-[rgba(55,50,47,0.12)]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="first-list-description" className="text-[#37322F]">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="first-list-description"
                          placeholder="Describe the purpose of this list..."
                          className="bg-white border-[rgba(55,50,47,0.12)] min-h-[100px]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        className="border-[rgba(55,50,47,0.12)] text-[#37322F]"
                      >
                        Cancel
                      </Button>
                      <Button className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
                        Create List
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
              <Card
                key={list._id?.toString()}
                className="border-[rgba(55,50,47,0.12)] bg-white hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-[#37322F] mb-1">
                        {list.name}
                      </CardTitle>
                      <CardDescription className="text-[#605A57] text-sm">
                        {list.description || "No description"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[#605A57] hover:bg-[rgba(55,50,47,0.08)]"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-[rgba(55,50,47,0.12)]">
                        <DropdownMenuItem className="text-[#37322F]">
                          Edit List
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[#37322F]">
                          Export Leads
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Delete List
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#605A57]">Leads</span>
                      <span className="text-sm font-semibold text-[#37322F]">
                        {list.leadCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#605A57]">
                      <span>Updated</span>
                      <span>{new Date(list.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
                      asChild
                    >
                      <Link href={`/leads?list=${list._id?.toString()}`}>
                        View Leads
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
