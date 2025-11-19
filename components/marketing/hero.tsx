import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function Hero() {
  const session = await auth();
  const user = session?.user ? { ...session.user, role: session.user.role } : null;

  return (
    <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge - Minimal */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-secondary/50 text-secondary-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-sm font-medium font-sans">
            AI-Powered Lead Generation
          </span>
        </div>

        {/* Heading - Classic, Clean */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-foreground mb-8 font-serif text-balance">
          Find & Connect With
          <br />
          <span className="italic text-primary">
            Your Next Customer
          </span>
        </h1>

        {/* Subheading - Professional */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-sans text-pretty">
          Streamline your lead generation with AI-powered search. Find contacts, verify emails, and launch personalized outreach campaigns—all in one platform.
        </p>

        {/* CTA Buttons - Clean, Minimal */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          {!user ? (
            <>
              <form
                action={async () => {
                  "use server";
                  const { signIn } = await import("@/auth");
                  await signIn("google");
                }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="px-8 py-6 text-base font-medium font-sans"
                >
                  Get Started Free
                </Button>
              </form>
              
              <Button asChild variant="outline" size="lg" className="px-8 py-6 text-base font-medium font-sans border-2">
                <Link href="/#features">
                  Learn More
                </Link>
              </Button>
            </>
          ) : (
            
              <Link href={user.role === "admin" ? "/c" : "/c"} >
                <Button className="px-8 py-6  rounded-full bg-slate-200  text-slate-900 text-base font-medium font-sans">
                  Get Started
                </Button>               
              </Link>
           
          )}
        </div>

        {/* Trust indicators - Minimal */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground font-sans">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <span>Free trial available</span>
          </div>
        </div>
      </div>
    </section>
  );
}
