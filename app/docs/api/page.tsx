import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { NavbarWrapper } from "@/components/layout/navbar-wrapper"
import { Code } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ApiDocsPage() {
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
            <h1 className="text-3xl font-bold text-foreground">API Integration</h1>
            <p className="text-muted-foreground mt-2">Integrate LogiGrow API in your applications</p>
          </div>

        <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Developer documentation for Logician REST API endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            API documentation is in progress. This will include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Authentication and API keys</li>
            <li>RESTful endpoint reference</li>
            <li>Request/response examples</li>
            <li>Rate limiting and quotas</li>
            <li>SDK libraries and code samples</li>
          </ul>
        </CardContent>
      </Card>
        </div>
      </div>
    </>
  )
}
