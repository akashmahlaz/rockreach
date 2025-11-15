import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export async function FeaturedVideo() {
  const session = await auth();
  const user = session?.user ? { ...session.user, role: session.user.role } : null;

  return (
    <section className=" bg-amber-200 w-full flex flex-col justify-center items-center dark:bg-gray-800">
      <div className="min-h-screen bg-gradient-to-b from-amber-200 to-white w-full justify-center">
        <Image
          src="/leads.png"
          alt="Featured Photo"
          width={12800}
          height={12000}
          className="w-full h-auto mx-auto rounded-2xl shadow-2xl "
        />
      </div>
    </section>
  );
}
