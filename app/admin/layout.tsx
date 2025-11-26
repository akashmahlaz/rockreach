import { NavbarWrapper } from "@/components/layout/navbar-wrapper"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <NavbarWrapper />
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </>
  )
}
