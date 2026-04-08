import SidebarLayout from "@/components/sidebar-layout";

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
