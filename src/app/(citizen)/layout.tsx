import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="citizen">{children}</DashboardLayout>;
}
