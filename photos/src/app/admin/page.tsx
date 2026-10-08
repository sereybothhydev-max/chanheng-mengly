/**
 * /admin — the couple's dashboard.
 * The password check happens HERE on the server: if the session cookie isn't
 * valid, the dashboard code is never even sent to the browser.
 */
import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ផ្ទាំងគ្រប់គ្រងគូស្វាមីភរិយា",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  return (await isAdmin()) ? <AdminDashboard /> : <AdminLogin />;
}
