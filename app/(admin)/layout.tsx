import { AdminLayout as AdminLayoutComponent } from "@/components/admin/AdminLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutComponent>{children}</AdminLayoutComponent>;
}

