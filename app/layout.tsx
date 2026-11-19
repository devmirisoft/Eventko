import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { me } from "@/lib/auth";
import { Role } from "@/lib/db";
import { Shell, type NavLink } from "./client";
import "./globals.css";

export const metadata: Metadata = { title: "Event Manager" };

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const m = await me();
  const role = m && (await Role.findById(m.roleId, "name").lean());
  const links: NavLink[] = m?.isAdmin
    ? [
        ["/dashboard", "Dashboard", "dashboard"],
        ["/members", "Members", "users"],
        ["/members/new", "Add Member", "userPlus"],
        ["/approvals", "Approvals", "userCheck"],
        ["/hierarchy", "Hierarchy", "network"],
        ["/events", "Events", "calendar"],
        ["/meetings", "Meetings", "meeting"],
      ]
    : [
        ["/dashboard", "Dashboard", "dashboard"],
        [`/members/${m?._id}/payments`, "My Payments", "wallet"],
        ["/events", "Events", "calendar"],
        ["/meetings", "Meetings", "meeting"],
      ];

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-surface font-sans text-ink antialiased">
        {m ? (
          // pass only display fields: `m` itself carries the password
          <Shell links={links} user={{ name: m.name, role: role?.name ?? "" }}>{children}</Shell>
        ) : (
          <main className="px-4 py-8 sm:py-12">{children}</main>
        )}
      </body>
    </html>
  );
}
