import Link from "next/link"

export default function FooterSection() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="font-semibold text-lg text-foreground font-sans">LogiGrow</div>
            <p className="text-sm text-muted-foreground font-sans">
              AI-powered lead generation and email outreach platform
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 font-sans">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/docs/guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 font-sans">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 font-sans">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  Terms of use
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground font-sans">
          <p>&copy; {new Date().getFullYear()} LogiGrow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
