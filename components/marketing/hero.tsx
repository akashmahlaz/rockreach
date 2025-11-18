import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export async function Hero() {
  const session = await auth();
  const user = session?.user ? { ...session.user, role: session.user.role } : null;

  return (
    <section className="bg-linear-to-t from-neutral-100 to-white dark:bg-gray-800 relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-slate-50 bg-white/80 shadow-sm backdrop-blur">
          <Sparkles className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            Built for professionals
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6">
          The First AI Powered
          <br />
          <span className="bg-linear-to-r font-bold font-sans from-slate-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            Lead Generation Platform
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Streamline your lead generation with AI-powered search.
          Find contacts, verify emails, and launch personalized outreach campaigns—all in one platform.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
                  className="rounded-4xl font-stretch-expanded font-bold font-sans bg-slate-50 text-gray-800 hover:bg-amber-500 hover:text-white hover:border-2 border-amber-500 transition-all px-8 py-8 text-lg"
                >
                  Start Now
                </Button>
              </form>
              
                <Link className="flex flex-row" href="/features">
                <Button className="rounded-4xl font-stretch-expanded font-bold font-sans bg-slate-50 text-gray-800 hover:bg-amber-500 hover:text-white hover:border-2 border-amber-500 transition-all px-8 py-8 text-lg">
                  Learn More
                </Button>k
                </Link>
             
            </>
          ) : (
              <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
               <Button  className="rounded-4xl font-stretch-expanded font-bold font-sans bg-neutral-700     text-gray-50 hover:bg-neutral-700 hover:text-white hover:border-2 border-slate-500 transition-all px-8 py-8 text-lg">
                 .....
               </Button>
              </Link> 
          )}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Professional AI powered lead generation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
