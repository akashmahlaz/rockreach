
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import client, { getDb } from "@/lib/db"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  adapter: MongoDBAdapter(client),
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, user }) {
      // Add user info to session
      if (session?.user) {
        // Get user from database to check role
        const db = await getDb();
        const dbUser = await db.collection("users").findOne({ email: user.email });
        
        // Add role from database (default to 'user' if not set)
        // @ts-expect-error - Extending user type with role
        session.user.role = dbUser?.role || "user";
        session.user.id = user.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect based on role
      if (url.startsWith(baseUrl)) {
        // Default redirect to dashboard
        return `${baseUrl}/dashboard`;
      }
      return url;
    },
  },
})