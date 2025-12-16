import { NavbarWrapper } from "@/components/layout/navbar-wrapper"
import { Hero } from "@/components/marketing/hero"
import { Stats } from "@/components/marketing/stats"
import { Testimonials } from "@/components/marketing/testimonials"
import PricingSection from "@/components/marketing/pricing"
import FAQSection from "@/components/marketing/faq"
import CTASection from "@/components/marketing/cta"
import FooterSection from "@/components/marketing/footer"
import { FeaturedVideo } from "@/components/home/video"
import { auth } from "@/auth" 
import SignIn from "@/components/auth/sign-in"

export default async function LandingPage() {
  const session = await auth(); 
  const isAdmin = session?.user?.role === "admin"; 

  // --- 1. IF USER IS NOT ADMIN (The Unique Design) ---
  if (!session){
    return <SignIn/>
  }
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden relative selection:bg-red-500 selection:text-black">
        
        {/* CSS for the glitch effect */}
        <style>{`
          @keyframes glitch-anim {
            0% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 1px); }
            20% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -1px); }
            40% { clip-path: inset(10% 0 60% 0); transform: translate(-2px, 2px); }
            60% { clip-path: inset(60% 0 20% 0); transform: translate(2px, -2px); }
            80% { clip-path: inset(20% 0 50% 0); transform: translate(-1px, 2px); }
            100% { clip-path: inset(50% 0 10% 0); transform: translate(1px, -2px); }
          }
          .glitch-wrapper::before, .glitch-wrapper::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
          }
          .glitch-wrapper::before {
            left: 2px;
            text-shadow: -1px 0 #ff00c1;
            animation: glitch-anim 2s infinite linear alternate-reverse;
          }
          .glitch-wrapper::after {
            left: -2px;
            text-shadow: -1px 0 #00fff9;
            animation: glitch-anim 3s infinite linear alternate-reverse;
          }
        `}</style>

        {/* The Text Content */}
        <div className="relative z-10 text-center space-y-4">
          <h1 
            className="glitch-wrapper text-6xl md:text-8xl font-black text-white tracking-tighter uppercase relative" 
            data-text="ACCESS DENIED"
          >
            ACCESS DENIED
          </h1>
          <p className="text-red-500 font-mono text-xl md:text-2xl tracking-widest uppercase opacity-80 animate-pulse">
            System Under Construction
          </p>
        </div>

        {/* Optional: CRT Scanline Overlay for extra "retro" feel */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      </div>
    );
  }

  // --- 2. REGULAR PAGE (For Admins) ---
  return (
    <>
      <NavbarWrapper />
      <div className="w-full min-h-screen">
        <Hero />
        <FeaturedVideo />
        <Stats />
        <Testimonials />
        <PricingSection />
        <FAQSection />
        <CTASection />
        <FooterSection />
      </div>
    </>
  );
}