import SidebarLayout from "@/components/sidebar-layout";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
