import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { db, Member } from "./db";

// ponytail: cookie holds the raw member _id (spec'd demo auth, forgeable). Sign it (e.g. iron-session) before real use.
export const me = cache(async () => {
  // cookies() first: it marks the route dynamic, so `next build` stops before ever connecting to the DB
  const id = (await cookies()).get("mid")?.value;
  await db();
  return isValidObjectId(id) ? Member.findOne({ _id: id, status: "approved" }).lean() : null;
});

export async function auth(adminOnly = false) {
  const m = await me();
  if (!m) redirect("/");
  if (adminOnly && !m.isAdmin) redirect("/dashboard");
  return m;
}
