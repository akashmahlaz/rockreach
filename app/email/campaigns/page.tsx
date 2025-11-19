import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { NavbarWrapper } from "@/components/layout/navbar-wrapper"
import { Send } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CampaignsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <>
      <NavbarWrapper />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Email Campaigns</h1>
            <p className="text-muted-foreground mt-2">Create and manage email outreach campaigns</p>
          </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            AI-powered email campaign builder with automated follow-ups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email campaigns feature is under development. Coming features:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Create campaigns with AI-generated content</li>
            <li>Select leads from your lists</li>
            <li>Schedule and automate sending</li>
            <li>Track opens, clicks, and responses</li>
            <li>A/B test different messages</li>
          </ul>
        </CardContent>
      </Card>
        </div>
      </div>
    </>
  )
}
