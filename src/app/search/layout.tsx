import SidebarLayout from "@/components/sidebar-layout";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
