import SidebarLayout from "@/components/sidebar-layout";

export default function OutreachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
