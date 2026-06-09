import SidebarLayout from "@/components/sidebar-layout";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
