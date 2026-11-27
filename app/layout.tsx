import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { me } from "@/lib/auth";
import { Member, Role } from "@/lib/db";
import { Shell, type NavLink } from "./client";
import { photoUrl } from "./ui";
import "./globals.css";

export const metadata: Metadata = { title: "Eventko" };
export const viewport: Viewport = { viewportFit: "cover" }; // env(safe-area-inset-*) for the bottom nav and sheets

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-display", preload: false }); // landing headlines only

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const m = await me();
  const [role, pending] = m ? await Promise.all([Role.findById(m.roleId, "name").lean(), m.isAdmin ? Member.countDocuments({ status: "pending" }) : 0]) : [];
  const pay = `/members/${m?._id}/payments`;

  const links: NavLink[] = m?.isAdmin
    ? [
        ["/dashboard", "Home", "home"],
        ["/events", "Events", "calendar"],
        ["/members", "Members", "users", pending],
        ["/hierarchy", "Hierarchy & Roles", "network"],
        ["/payments", "Payments", "wallet"],
        ["/meetings", "Meetings", "meeting"],
        ["/history", "Organization History", "history"],
        ["/reports", "Reports & Analytics", "chart"],
        ["/settings", "Settings", "settings"],
      ]
    : [
        ["/dashboard", "Home", "home"],
        ["/events", "Events", "calendar"],
        [pay, "My Payments", "wallet"],
        ["/meetings", "Meetings", "meeting"],
        ["/settings", "Settings", "settings"],
      ];
  // phone bottom tabs; every other link goes in the "More" sheet
  const tabs: NavLink[] = [
    ["/dashboard", "Home", "home"],
    ["/events", "Events", "calendar"],
    m?.isAdmin ? ["/members", "Members", "users"] : [pay, "Payments", "wallet"],
    ["/settings", "Profile", "user"],
  ];

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh bg-surface font-sans text-ink antialiased">
        {m ? (
          // pass only display fields: `m` itself carries the password
          <Shell links={links} tabs={tabs} user={{ name: m.name, role: role?.name ?? "", src: photoUrl(m), isAdmin: !!m.isAdmin }}>{children}</Shell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
