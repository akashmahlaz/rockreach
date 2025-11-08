import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDb, Collections } from "@/lib/db";
import { ObjectId } from "mongodb";

interface LeadDocument {
  _id: ObjectId;
  orgId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  emails?: string[];
  phones?: string[];
  linkedin?: string;
  linkedin_url?: string;
  location?: string;
  tags?: string[];
  raw?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const orgId = session.user.orgId ?? session.user.email;

  if (!orgId) {
    redirect("/dashboard");
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    notFound();
  }

  const db = await getDb();
  const lead = await db
    .collection<LeadDocument>(Collections.LEADS)
    .findOne({ _id: new ObjectId(id), orgId });

  if (!lead) {
    notFound();
  }

  const primaryEmail = lead.emails?.[0];
  const primaryPhone = lead.phones?.[0];
  const linkedInUrl = lead.linkedin || lead.linkedin_url;

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#37322F] font-serif">{lead.name || "Lead"}</h1>
            <p className="text-[#605A57] mt-2">
              {lead.title ? `${lead.title}${lead.company ? " · " : ""}` : ""}
              {lead.company || "Company unknown"}
            </p>
          </div>
          <Button asChild className="bg-[#37322F] hover:bg-[#37322F]/90 text-white">
            <Link href="/leads">Back to Leads</Link>
          </Button>
        </div>

        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-[#37322F]">Contact Information</CardTitle>
            <CardDescription className="text-[#605A57]">
              Key details captured for this lead
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-[#605A57]">Primary Email</p>
              <p className="text-sm text-[#37322F] break-all">{primaryEmail ?? "Not available"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-[#605A57]">Primary Phone</p>
              <p className="text-sm text-[#37322F]">{primaryPhone ?? "Not available"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-[#605A57]">LinkedIn</p>
              {linkedInUrl ? (
                <Link
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#0A66C2] hover:underline"
                >
                  {linkedInUrl}
                </Link>
              ) : (
                <p className="text-sm text-[#37322F]">Not available</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-[#605A57]">Location</p>
              <p className="text-sm text-[#37322F]">{lead.location ?? "Not available"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-[#37322F]">Tags</CardTitle>
            <CardDescription className="text-[#605A57]">
              Labels applied to this lead
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lead.tags && lead.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-[#F7F5F3] border-[rgba(55,50,47,0.12)] text-[#37322F]">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#605A57]">No tags yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-[#37322F]">Raw Profile Data</CardTitle>
            <CardDescription className="text-[#605A57]">
              Original enrichment payload for auditing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-md bg-[#F7F5F3] p-4 text-xs text-[#37322F]">
              {JSON.stringify(lead.raw ?? lead, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
