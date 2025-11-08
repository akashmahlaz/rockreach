import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { createAuditLog } from "@/models/AuditLog";

const ALLOWED_ROLES = new Set(["admin", "user"]);

type ParamsPromise = Promise<{ id: string }>; // Next.js 16 supplies params as a Promise

type SerializedUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
  orgId?: string | null;
  createdAt?: string | null;
  emailVerified?: string | null;
};

function serializeUser(doc: Record<string, unknown>): SerializedUser {
  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id ?? "");
  return {
    id,
    email: String(doc.email ?? ""),
    name: doc.name ? String(doc.name) : null,
    image: doc.image ? String(doc.image) : null,
    role: doc.role ? String(doc.role) : "user",
    orgId: doc.orgId ? String(doc.orgId) : null,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : null,
    emailVerified: doc.emailVerified instanceof Date ? doc.emailVerified.toISOString() : null,
  };
}

export async function PATCH(
  request: NextRequest,
  context: { params: ParamsPromise }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ ok: false, error: "Invalid user id" }, { status: 400 });
  }

  const payload = await request.json();

  const updates: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(payload, "role")) {
    const nextRole = typeof payload.role === "string" ? payload.role.trim().toLowerCase() : "";
    if (!ALLOWED_ROLES.has(nextRole as ("admin" | "user"))) {
      return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
    }
    updates.role = nextRole;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "orgId")) {
    const orgIdValue = typeof payload.orgId === "string" ? payload.orgId.trim() : null;
    updates.orgId = orgIdValue && orgIdValue.length > 0 ? orgIdValue : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: "No updates provided" }, { status: 400 });
  }

  updates.updatedAt = new Date();

  const db = await getDb();
  const updateResult = await db.collection("users").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!updateResult) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const updatedUser = updateResult.value as Record<string, unknown> | null;

  if (!updatedUser) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const serialized = serializeUser(updatedUser);

  const auditOrgId = session.user.orgId ?? serialized.orgId ?? "default";

  await createAuditLog({
    orgId: auditOrgId,
    actorId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    action: "admin_update_user",
    target: "user",
    targetId: serialized.id,
    meta: { updates },
  });

  return NextResponse.json({ ok: true, data: serialized });
}
