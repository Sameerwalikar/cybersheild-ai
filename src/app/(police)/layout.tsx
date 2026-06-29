import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function PoliceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="police">{children}</DashboardLayout>;
}
