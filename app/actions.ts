"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, Member, Role, Event, Meeting, Legacy, linkCode, wouldLoop } from "@/lib/db";
import { auth, me } from "@/lib/auth";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

const errMsg = (e: unknown) => {
  const x = e as { code?: number; keyValue?: object; message?: string };
  if (x.code === 11000) return `${"phone" in (x.keyValue ?? {}) ? "Phone" : "Member code"} already exists`;
  return x.message ?? "Something went wrong";
};

function ok(path: string): never {
  revalidatePath("/", "layout");
  redirect(path);
}

function fail(path: string, e: unknown): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(typeof e === "string" ? e : errMsg(e))}`);
}

const payment = (fd: FormData) => ({
  amount: Number(fd.get("amount")),
  type: s(fd, "type"),
  mode: s(fd, "mode"),
  status: s(fd, "status"),
  date: s(fd, "date") || undefined,
  note: s(fd, "note"),
});

export async function login(fd: FormData) {
  await db();
  const m = await Member.findOne({ phone: s(fd, "phone"), password: s(fd, "password") }).lean();
  if (!m) fail("/", "Invalid username or password");
  if (m.status !== "approved") fail("/", `Your account is ${m.status}`);
  (await cookies()).set("mid", String(m._id), { httpOnly: true, sameSite: "lax", path: "/" });
  ok("/dashboard");
}

export async function logout() {
  (await cookies()).delete("mid");
  ok("/");
}

// Public (linked from login). Returns an error string so the client form keeps its input.
export async function createMember(fd: FormData) {
  const viewer = await me();
  try {
    await Member.create({
      name: s(fd, "name"),
      phone: s(fd, "phone"),
      memberCode: s(fd, "memberCode"),
      roleId: s(fd, "roleId"),
      payments: [payment(fd)],
    });
  } catch (e) {
    return errMsg(e);
  }
  ok(viewer?.isAdmin ? "/approvals" : "/members/new?sent=1");
}

export async function updateMember(id: string, fd: FormData) {
  await auth(true);
  const data = { name: s(fd, "name"), phone: s(fd, "phone"), memberCode: s(fd, "memberCode"), roleId: s(fd, "roleId"), status: s(fd, "status") };
  try {
    await Member.updateOne({ _id: id }, data, { runValidators: true });
  } catch (e) {
    fail(`/members/${id}`, e);
  }
  ok("/members");
}

export async function setStatus(id: string, status: string) {
  await auth(true);
  await Member.updateOne({ _id: id }, { status }, { runValidators: true });
  ok("/approvals");
}

export async function addPayment(id: string, fd: FormData) {
  await auth(true);
  await Member.updateOne({ _id: id }, { $push: { payments: payment(fd) } }, { runValidators: true });
  ok(`/members/${id}/payments`);
}

export async function markPaid(id: string, paymentId: string) {
  await auth(true);
  await Member.updateOne({ _id: id, "payments._id": paymentId }, { $set: { "payments.$.status": "paid" } });
  ok(`/members/${id}/payments`);
}

export async function saveRole(id: string | null, fd: FormData) {
  await auth(true);
  const parentId = s(fd, "parentId") || null;
  if (id && wouldLoop(await Role.find().lean(), id, parentId)) fail("/hierarchy", "A role can't be placed under itself or its own sub-role");
  const data = { name: s(fd, "name"), codePrefix: s(fd, "codePrefix"), parentId };
  try {
    await (id ? Role.updateOne({ _id: id }, data, { runValidators: true }) : Role.create(data));
  } catch (e) {
    fail("/hierarchy", e);
  }
  ok("/hierarchy");
}

export async function deleteRole(id: string) {
  await auth(true);
  if (await Member.exists({ roleId: id })) fail("/hierarchy", "Role has members. Reassign them first.");
  if (await Role.exists({ parentId: id })) fail("/hierarchy", "Role has child roles. Move or delete them first.");
  await Role.deleteOne({ _id: id });
  ok("/hierarchy");
}

export async function saveEvent(id: string | null, fd: FormData) {
  await auth(true);
  const data = {
    title: s(fd, "title"),
    date: s(fd, "date"),
    venue: s(fd, "venue"),
    description: s(fd, "description"),
    attendees: fd.getAll("attendees").map(String),
  };
  if (id) await Event.updateOne({ _id: id }, data);
  else id = String((await Event.create(data))._id);
  ok(`/events/${id}`);
}

export async function deleteEvent(id: string) {
  await auth(true);
  await Event.deleteOne({ _id: id });
  ok("/events");
}

export async function saveMeeting(id: string | null, fd: FormData) {
  await auth(true);
  const data = { date: s(fd, "date"), destination: s(fd, "destination"), title: s(fd, "title"), notes: s(fd, "notes") };
  await (id ? Meeting.updateOne({ _id: id }, data, { runValidators: true }) : Meeting.create(data));
  ok("/meetings");
}

export async function deleteMeeting(id: string) {
  await auth(true);
  await Meeting.deleteOne({ _id: id });
  ok("/meetings");
}

const legacyPath = (type: string) => `/hierarchy?tab=${type === "founder" ? "founders" : "presidents"}`;

export async function saveLegacy(type: string, id: string | null, fd: FormData) {
  await auth(true);
  const path = legacyPath(type);
  const who = s(fd, "who");
  const code = linkCode(who);
  const m = code ? await Member.findOne({ memberCode: code }, "name").lean() : null; // no match -> kept as a typed name
  const year = (k: string) => (s(fd, k) ? Number(s(fd, k)) : null);
  const data = { type, name: m?.name ?? who, memberId: m?._id ?? null, fromYear: year("fromYear"), toYear: year("toYear"), note: s(fd, "note") };
  if (data.fromYear && data.toYear && data.toYear < data.fromYear) fail(path, "Term to can't be before term from");
  try {
    await (id ? Legacy.updateOne({ _id: id, type }, data, { runValidators: true }) : Legacy.create(data));
  } catch (e) {
    fail(path, e);
  }
  ok(path);
}

export async function deleteLegacy(type: string, id: string) {
  await auth(true);
  await Legacy.deleteOne({ _id: id, type });
  ok(legacyPath(type));
}
