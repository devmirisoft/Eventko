"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createMember } from "../../actions";
import { Alert, AuthHead, MemberDateFields, PaymentFields, PhoneInput } from "../../ui";

type Roles = { id: string; name: string }[];
type Props = { roles: Roles; codes: Record<string, string>; cancel: string };

const req = <span aria-hidden className="text-bad-ink">*</span>;

// Public sign-up (logged out). The server picks the member code; an admin approves before they can log in.
export function JoinForm({ roles }: { roles: Roles }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => setError((await createMember(fd)) ?? ""));
      }}
    >
      <AuthHead title="Join the organization" sub="Be part of our events, initiatives and community." />
      <Alert className="">{error}</Alert>
      <label className="field"><span>Full name {req}</span><input name="name" required autoComplete="name" placeholder="Your full name" className="input" /></label>
      <div className="field">
        <label htmlFor="join-phone">Phone number {req}</label>
        <PhoneInput id="join-phone" name="phone" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="10-digit mobile number" placeholder="9876543210" required autoComplete="tel-national" />
      </div>
      <label className="field">
        <span>Designation (applying for) {req}</span>
        <select name="roleId" required defaultValue="" className="input">
          <option value="" disabled>Select designation</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </label>
      <p className="well px-4 py-3 text-sm text-muted">An admin reviews every application. You can log in once it&apos;s approved.</p>
      <button disabled={pending} aria-busy={pending} className="btn w-full">{pending ? "Submitting…" : "Submit application"}</button>
      <p className="border-t border-line pt-5 text-center text-sm text-muted">Already a member? <Link href="/?login" className="link">Log in</Link></p>
    </form>
  );
}

// Client only for the code auto-fill. Submits via onSubmit (not <form action>) so React
// doesn't reset the fields when the server returns an error.
export default function NewMemberForm({ roles, codes, cancel }: Props) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [code, setCode] = useState(codes[roleId] ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const suggested = codes[roleId] ?? "";
  // only follow the designation while the field still holds a suggestion (or is empty), never over a manual edit
  const isSuggestion = (c: string) => !c || Object.values(codes).includes(c.toUpperCase());

  return (
    <form
      className="card space-y-8 p-5 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => setError((await createMember(fd)) ?? ""));
      }}
    >
      <Alert className="">{error}</Alert>

      <section>
        <h2 className="font-semibold">Personal information</h2>
        <p className="mt-0.5 text-sm text-muted">Basic details.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="field">Full name<input name="name" required autoComplete="off" className="input" /></label>
          <label className="field">Phone number<input name="phone" type="tel" inputMode="numeric" required autoComplete="off" className="input" /></label>
          <label className="field">
            Designation
            <select
              name="roleId"
              value={roleId}
              onChange={(e) => {
                setRoleId(e.target.value);
                if (isSuggestion(code)) setCode(codes[e.target.value] ?? "");
              }}
              className="input"
            >
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <div className="field">
            <label htmlFor="member-code">Member code</label>
            <input id="member-code" name="memberCode" required value={code} onChange={(e) => setCode(e.target.value)} aria-describedby="code-hint" className="input font-mono uppercase" />
            <span id="code-hint" className="hint">
              {code.toUpperCase() === suggested ? (
                "Suggested from designation. You can edit it."
              ) : (
                <>Suggested: <button type="button" onClick={() => setCode(suggested)} className="link font-mono">{suggested}</button></>
              )}
            </span>
          </div>
          <MemberDateFields />
        </div>
      </section>

      <hr className="border-line" />

      <section>
        <h2 className="font-semibold">Initial payment</h2>
        <p className="mt-0.5 text-sm text-muted">Recorded with the registration.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <PaymentFields />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancel} className="btn btn-ghost">Cancel</Link>
        <button disabled={pending} aria-busy={pending} className="btn">{pending ? "Creating…" : "Create member"}</button>
      </div>
    </form>
  );
}
