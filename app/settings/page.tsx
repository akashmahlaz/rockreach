import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import SettingsClient from "@/components/settings/settings-client";

export const metadata = {
  title: "Settings",
  description: "Manage your account and integration settings",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <>
      <NavbarWrapper />
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings, email configuration, and WhatsApp integration
            </p>
          </div>

          <Suspense fallback={<div className="text-muted-foreground">Loading settings...</div>}>
            <SettingsClient user={session.user || { name: null, email: null }} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
