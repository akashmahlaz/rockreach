import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
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
    <>
      <NavbarWrapper />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{lead.name || "Lead"}</h1>
              <p className="text-muted-foreground mt-2">
                {lead.title ? `${lead.title}${lead.company ? " · " : ""}` : ""}
                {lead.company || "Company unknown"}
              </p>
            </div>
            <Button asChild>
              <Link href="/leads">Back to Leads</Link>
            </Button>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Key details captured for this lead
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary Email</p>
                  <p className="text-sm text-foreground break-all">{primaryEmail ?? "Not available"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary Phone</p>
                  <p className="text-sm text-foreground">{primaryPhone ?? "Not available"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">LinkedIn</p>
                  {linkedInUrl ? (
                    <Link
                      href={linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {linkedInUrl}
                    </Link>
                  ) : (
                    <p className="text-sm text-foreground">Not available</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Location</p>
                  <p className="text-sm text-foreground">{lead.location ?? "Not available"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Labels applied to this lead
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lead.tags && lead.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Raw Profile Data</CardTitle>
                <CardDescription>
                  Original enrichment payload for auditing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs text-foreground">
                  {JSON.stringify(lead.raw ?? lead, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
