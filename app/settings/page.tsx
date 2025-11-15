import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
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
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Manage your account settings, email configuration, and WhatsApp integration
        </p>

        <Suspense fallback={<div>Loading settings...</div>}>
          <SettingsClient user={session.user || { name: null, email: null }} />
        </Suspense>
      </div>
    </div>
  );
}
