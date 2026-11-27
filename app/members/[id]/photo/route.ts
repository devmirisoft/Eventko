import { Member } from "@/lib/db";
import { auth } from "@/lib/auth";

// Any signed-in member can see photos. URLs carry ?v=<upload time> (photoUrl), so a new upload gets a new URL.
export async function GET(_req: Request, ctx: RouteContext<"/members/[id]/photo">) {
  await auth();
  const { id } = await ctx.params;
  const m = await Member.findById(id, "photo").catch(() => null); // not lean: lean returns a BSON Binary, not a Buffer
  if (!m?.photo?.length) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(m.photo), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
