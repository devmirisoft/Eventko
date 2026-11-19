// bun run seed — WIPES roles/members/events/meetings/legacies, then loads demo data.
import mongoose from "mongoose";
import { db, Event, Legacy, Meeting, Member, Role, nextCode } from "../lib/db";

const { ADMIN, PASSWORD } = process.env; // admin login (phone field) + password
if (!ADMIN || !PASSWORD) throw new Error("Set ADMIN and PASSWORD in .env");

await db();
await Promise.all([Role, Member, Event, Meeting, Legacy].map((M) => M.deleteMany({})));
await Member.init(); // make sure the unique indexes exist

const midnight = new Date(new Date().toISOString().slice(0, 10));
const daysAgo = (n: number) => new Date(+midnight - n * 864e5);

// President -> Secretary -> Manager -> Member
const roles = [];
let parentId: unknown = null;
for (const [name, codePrefix] of [["President", "PRE"], ["Secretary", "SEC"], ["Manager", "MGR"], ["Member", "MEM"]]) {
  const r = await Role.create({ name, codePrefix, parentId });
  roles.push(r);
  parentId = r._id;
}

const admin = await Member.create({
  name: "Admin", phone: ADMIN, password: PASSWORD, memberCode: "PRE-0001",
  roleId: roles[0]._id, status: "approved", isAdmin: true,
  payments: [{ amount: 5000, type: "Membership", mode: "Bank", status: "paid", date: daysAgo(90), note: "Founding member" }],
});

const people: [string, number, string][] = [
  ["Riya Sharma", 1, "approved"], ["Arjun Mehta", 1, "approved"],
  ["Kabir Singh", 2, "approved"], ["Neha Gupta", 2, "approved"], ["Vikram Rao", 2, "pending"],
  ["Priya Nair", 3, "approved"], ["Rohan Das", 3, "approved"], ["Anjali Verma", 3, "pending"],
  ["Sameer Khan", 3, "pending"], ["Pooja Iyer", 3, "approved"],
];
const codes = ["PRE-0001"];
const approved = [];
for (const [i, [name, r, status]] of people.entries()) {
  const memberCode = nextCode(roles[r].codePrefix, codes);
  codes.push(memberCode);
  const m = await Member.create({
    name, phone: `90000000${String(i + 1).padStart(2, "0")}`, password: "pass123", memberCode, roleId: roles[r]._id, status,
    payments: [
      { amount: 500, type: "Registration", mode: i % 2 ? "UPI" : "Cash", status: i % 4 === 3 ? "due" : "paid", date: daysAgo(60 - i), note: "Joining fee" },
      ...(status === "approved" ? [{ amount: 1200, type: "Membership", mode: "UPI", status: i % 3 ? "paid" : "due", date: daysAgo(10), note: "Annual membership" }] : []),
    ],
  });
  if (status === "approved") approved.push(m._id);
}

await Event.create([
  { title: "Annual General Meeting", date: daysAgo(20), venue: "Community Hall", description: "Yearly review of accounts and election of office bearers.", attendees: approved.slice(0, 5) },
  { title: "Charity Food Drive", date: daysAgo(-7), venue: "City Park", description: "Collecting and distributing food packets for the needy.", attendees: approved.slice(2, 6) },
  { title: "Diwali Celebration", date: daysAgo(-30), venue: "Club House", description: "Cultural evening, dinner and fireworks for members and families." },
]);

await Meeting.create([
  { date: daysAgo(3), destination: "Club House", title: "Diwali celebration planning",
    notes: "Budget approved: ₹45,000.\nDecorations: Neha's team. Food: tender to be floated by Friday.\nNext check-in in one week." },
  { date: daysAgo(12), destination: "City Municipal Office", title: "Park cleanup permission",
    notes: "Met the ward officer about using City Park for the food drive.\nPermission granted for one day; need an NOC copy on site.\nArjun to collect the signed letter." },
  { date: daysAgo(25), destination: "Community Hall", title: "Quarterly accounts review",
    notes: "Collections are up 12% on last quarter.\n3 members still have dues pending; send reminders.\nAudit to be done before the AGM." },
  { date: daysAgo(41), destination: "Sunrise Public School", title: "Scholarship drive tie-up",
    notes: "Principal agreed to shortlist 10 students.\nWe fund books and uniforms; school handles selection.\nMoU draft to be shared by Riya." },
  { date: daysAgo(70), destination: "Online (Zoom)", title: "New member onboarding process",
    notes: "Agreed on a single registration form with first payment.\nAll new members need admin approval before they can log in.\nKabir to prepare a welcome note." },
]);

const riya = await Member.findOne({ name: "Riya Sharma" });
await Legacy.create([
  { type: "founder", name: admin.name, memberId: admin._id, fromYear: 2015, note: "Convened the first meeting" },
  { type: "founder", name: riya.name, memberId: riya._id, fromYear: 2015 },
  { type: "founder", name: "Harish Menon", fromYear: 2015, note: "Drafted the original bylaws" },
  { type: "founder", name: "Lata Kulkarni", fromYear: 2016, note: "Set up the first scholarship fund" },
  { type: "past_president", name: "Harish Menon", fromYear: 2015, toYear: 2018, note: "First president" },
  { type: "past_president", name: "Suresh Patel", fromYear: 2018, toYear: 2021 },
  { type: "past_president", name: riya.name, memberId: riya._id, fromYear: 2021, toYear: 2024, note: "Led the food drive programme" },
]);

console.log(`Seeded. Admin login: ${ADMIN} (password from .env) · members 9000000001-9000000010 / pass123`);
await mongoose.disconnect();
