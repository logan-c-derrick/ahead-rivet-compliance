import SidebarLayout from "@/components/sidebar-layout";

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
