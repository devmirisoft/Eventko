// bun run check — self-check for the two bits of real logic.
import assert from "node:assert/strict";
import { linkCode, nextCode, wouldLoop } from "../lib/db";

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

console.log("ok");
