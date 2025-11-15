import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { ProductDemo } from "@/components/marketing/product-demo"
import { Stats } from "@/components/marketing/stats"
import { Testimonials } from "@/components/marketing/testimonials"
import PricingSection from "@/components/marketing/pricing"
import FAQSection from "@/components/marketing/faq"
import CTASection from "@/components/marketing/cta"
import FooterSection from "@/components/marketing/footer"
import { FeaturedVideo } from "@/components/home/video"

export default async function LandingPage() {
  return (
    <div className="w-full min-h-screen ">
      <Hero />
      <FeaturedVideo/>
      {/* <Features />
      <ProductDemo /> */}
      <Stats />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
