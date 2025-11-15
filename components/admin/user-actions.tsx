"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreVertical, Ban, CheckCircle, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Lead {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  title?: string;
  location?: string;
  createdAt: Date;
}

interface UserActionsProps {
  userId: string;
  email: string;
  name?: string | null;
  banned?: boolean;
}

export function UserActions({ userId, email, name, banned }: UserActionsProps) {
  const router = useRouter();
  const [showLeadsDialog, setShowLeadsDialog] = useState(false);
  const [userLeads, setUserLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [actionType, setActionType] = useState<"ban" | "unban" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUserLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch(`/api/admin/users/leads?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserLeads(data);
      } else {
        toast.error("Failed to fetch user leads");
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to fetch user leads");
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleViewLeads = async () => {
    setShowLeadsDialog(true);
    await fetchUserLeads();
  };

  const handleUserAction = async (action: "ban" | "unban") => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
        }),
      });

      if (res.ok) {
        toast.success(`User ${action === "ban" ? "banned" : "unbanned"} successfully`);
        router.refresh();
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewLeads}>
            <Eye className="h-4 w-4 mr-2" />
            View Leads
          </DropdownMenuItem>
          {banned ? (
            <DropdownMenuItem onClick={() => setActionType("unban")}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setActionType("ban")}
              className="text-red-600 focus:text-red-600"
            >
              <Ban className="h-4 w-4 mr-2" />
              Ban User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Leads Dialog */}
      <Dialog open={showLeadsDialog} onOpenChange={setShowLeadsDialog}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#37322F]">
              Leads for {name || email}
            </DialogTitle>
            <DialogDescription className="text-[#605A57]">
              Total: {userLeads.length} leads
            </DialogDescription>
          </DialogHeader>
          {loadingLeads ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userLeads.map((lead) => (
                    <TableRow key={lead._id.toString()}>
                      <TableCell>
                        {lead.name || `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs">{lead.email || "N/A"}</TableCell>
                      <TableCell>{lead.company || "N/A"}</TableCell>
                      <TableCell className="text-xs">{lead.title || "N/A"}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {userLeads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        No leads found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban/Unban Confirmation Dialog */}
      <AlertDialog open={actionType !== null} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#37322F]">
              {actionType === "ban" ? "Ban User" : "Unban User"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#605A57]">
              Are you sure you want to {actionType} {email}?
              {actionType === "ban" && " This will prevent them from accessing the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionType && handleUserAction(actionType)}
              className={actionType === "ban" ? "bg-red-600 hover:bg-red-700" : ""}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing
                </span>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
