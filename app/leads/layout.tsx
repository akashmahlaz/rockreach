import { NavbarWrapper } from "@/components/layout/navbar-wrapper";

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarWrapper />
      {children}
    </>
  );
}
