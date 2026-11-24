import mongoose, { Schema, model, models } from "mongoose";

// connect() is a no-op when already connected to the same URI, so call it freely.
export const db = () => mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || "");

const ref = (name: string) => ({ type: Schema.Types.ObjectId, ref: name });
const createdAt = { type: Date, default: Date.now };

export const Role =
  models.Role ||
  model("Role", new Schema({
    name: { type: String, required: true, trim: true },
    codePrefix: { type: String, required: true, trim: true, uppercase: true },
    parentId: { ...ref("Role"), default: null },
    createdAt,
  }));

export const Member =
  models.Member ||
  model("Member", new Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: String, // plain text, demo only. Members added via the form have none, so they can't log in.
    memberCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    roleId: { ...ref("Role"), required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isAdmin: { type: Boolean, default: false },
    dateOfBirth: Date, // optional, UTC midnight like every other date here
    anniversaryDate: Date, // optional, marriage anniversary
    payments: [{
      amount: { type: Number, required: true, min: 0 },
      type: { type: String }, // a bare `type: String` would make mongoose treat the whole object as a String
      mode: String,
      status: { type: String, enum: ["paid", "due"], default: "due" },
      date: { type: Date, default: Date.now },
      note: String,
    }],
    createdAt,
  }));

export const Event =
  models.Event ||
  model("Event", new Schema({
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    venue: String,
    description: String,
    attendees: [ref("Member")],
    createdAt,
  }));

export const Meeting =
  models.Meeting ||
  model("Meeting", new Schema({
    date: { type: Date, required: true },
    destination: { type: String, trim: true },
    title: { type: String, required: true, trim: true }, // meeting name / objective
    notes: String,
    createdAt,
  }));

// Founding members and past presidents: linked to a member, or just a typed name for people not in the system.
export const Legacy =
  models.Legacy ||
  model("Legacy", new Schema({
    type: { type: String, enum: ["founder", "past_president"], required: true },
    name: { type: String, required: true, trim: true },
    memberId: { ...ref("Member"), default: null },
    fromYear: Number, // founders: joined/founded year
    toYear: Number, // past presidents only
    note: String,
    createdAt,
  }));

// case-insensitive "contains" match on user input
export const searchRe = (q: string) => new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

// "Priya Nair (MEM-0001)" -> "MEM-0001": the format the member picker offers. Anything else is a typed name.
export const linkCode = (who: string) => who.match(/\(([^()]+)\)\s*$/)?.[1].trim().toUpperCase() ?? null;

// "MGR" + ["MGR-0006", ...] -> "MGR-0007"
export function nextCode(prefix: string, codes: string[]) {
  const nums = codes.filter((c) => c.startsWith(prefix + "-")).map((c) => parseInt(c.slice(prefix.length + 1)) || 0);
  return `${prefix}-${String(Math.max(0, ...nums) + 1).padStart(4, "0")}`;
}

// Next time d's day + month comes round, on or after `from` (both UTC midnight). 29 Feb falls on 28 Feb in non-leap years.
export function nextOccurrence(d: Date, from: Date) {
  const m = d.getUTCMonth(), dd = d.getUTCDate();
  for (let y = from.getUTCFullYear(); ; y++) {
    const leap = new Date(Date.UTC(y, 1, 29)).getUTCDate() === 29;
    const t = new Date(Date.UTC(y, m, m === 1 && dd === 29 && !leap ? 28 : dd));
    if (t >= from) return t;
  }
}

type Dated = { dateOfBirth?: Date | null; anniversaryDate?: Date | null };

// birthdays + anniversaries within `days` of `from`, soonest first. left = 0 means today.
export function upcoming<T extends Dated>(members: T[], from: Date, days = 30) {
  return members
    .flatMap((m) => ([["Birthday", m.dateOfBirth], ["Anniversary", m.anniversaryDate]] as const).flatMap(([type, d]) => {
      if (!d) return [];
      const date = nextOccurrence(new Date(d), from);
      const left = Math.round((+date - +from) / 864e5);
      return left <= days ? [{ m, type, date, left }] : [];
    }))
    .sort((a, b) => a.left - b.left);
}

// true if putting role `id` under `parentId` would make it its own ancestor
export function wouldLoop(roles: { _id: unknown; parentId?: unknown }[], id: string, parentId: string | null) {
  const parent = new Map(roles.map((r) => [String(r._id), r.parentId ? String(r.parentId) : null]));
  for (let p = parentId, n = 0; p && n <= roles.length; p = parent.get(p) ?? null, n++) if (p === id) return true;
  return false;
}
