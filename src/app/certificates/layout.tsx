import SidebarLayout from "@/components/sidebar-layout";

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
