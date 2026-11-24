// bun run check — self-check for the two bits of real logic.
import assert from "node:assert/strict";
import { linkCode, nextCode, nextOccurrence, upcoming, wouldLoop } from "../lib/db";

assert.equal(nextCode("MGR", ["MGR-0006", "MGR-0002", "SEC-0009", "MGRX-0100"]), "MGR-0007");
assert.equal(nextCode("MEM", []), "MEM-0001");
assert.equal(nextCode("MEM", ["MEM-abc"]), "MEM-0001");

const roles = [{ _id: "a", parentId: null }, { _id: "b", parentId: "a" }, { _id: "c", parentId: "b" }];
assert.equal(wouldLoop(roles, "a", "c"), true); // under its own grandchild
assert.equal(wouldLoop(roles, "b", "b"), true); // under itself
assert.equal(wouldLoop(roles, "c", "a"), false); // moving up is fine
assert.equal(wouldLoop(roles, "a", null), false);

assert.equal(linkCode("Priya Nair (MEM-0001)"), "MEM-0001"); // picked from the member list
assert.equal(linkCode("Priya Nair (mem-0001) "), "MEM-0001");
assert.equal(linkCode("Harish Menon"), null); // typed name
assert.equal(linkCode("John (Sr) Doe"), null); // brackets mid-name aren't a link

const d = (s: string) => new Date(s); // UTC midnight
assert.deepEqual(nextOccurrence(d("1990-03-12"), d("2026-03-12")), d("2026-03-12")); // today counts
assert.deepEqual(nextOccurrence(d("1990-03-11"), d("2026-03-12")), d("2027-03-11")); // just passed -> next year
assert.deepEqual(nextOccurrence(d("1990-01-05"), d("2026-12-20")), d("2027-01-05")); // wraps the year end
assert.deepEqual(nextOccurrence(d("2000-02-29"), d("2027-02-01")), d("2027-02-28")); // 29 Feb, non-leap year
assert.deepEqual(nextOccurrence(d("2000-02-29"), d("2028-02-01")), d("2028-02-29")); // 29 Feb, leap year
assert.deepEqual(nextOccurrence(d("2000-02-29"), d("2027-03-01")), d("2028-02-29")); // missed 28 Feb -> next leap day
const up = upcoming([
  { dateOfBirth: d("1990-01-05"), anniversaryDate: d("2015-12-20") },
  { dateOfBirth: d("1985-06-01"), anniversaryDate: null }, // too far
  {}, // old member without the fields
], d("2026-12-20"));
assert.deepEqual(up.map((x) => [x.type, x.left]), [["Anniversary", 0], ["Birthday", 16]]);

console.log("ok");
